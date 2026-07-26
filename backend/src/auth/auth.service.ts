import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { GymMember } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { toUserProfileDto, type UserProfileDto } from './user-profile';

export type SafeUser = Omit<GymMember, 'password'>;

export interface JwtPayload {
  sub: number;
  username: string;
  role_name: string;
  /** Evita mezclar access vs refresh en el mismo formato de token. */
  kind: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  sanitize(member: GymMember): SafeUser {
    const { password: _p, ...rest } = member;
    return rest;
  }

  /** Replica UsersController::login (member caducado / no activado). */
  assertMemberMayLogin(member: GymMember): void {
    const role = (member.role_name ?? '').trim().toLowerCase();
    if (role !== 'member') {
      return;
    }

    if (member.activated !== 1) {
      throw new ForbiddenException(
        'Tu cuenta aún no está activada. Contacta con recepción.',
      );
    }

    const status = (member.membership_status ?? '').trim();
    if (status.toLowerCase() === 'expired') {
      throw new ForbiddenException(
        'Tu cuenta de socio está caducada. Renueva en recepción.',
      );
    }

    const expiry = member.membership_valid_to;
    if (expiry) {
      const today = this.todayUtcDateString();
      const exp =
        expiry instanceof Date
          ? expiry.toISOString().slice(0, 10)
          : String(expiry).slice(0, 10);
      if (today > exp) {
        throw new ForbiddenException(
          'Tu cuenta de socio está caducada. Renueva en recepción.',
        );
      }
    }
  }

  /** Evita NaN en expiresIn (jsonwebtoken lanza y Nest devuelve 500). */
  private parseJwtTtlSeconds(
    raw: string | undefined,
    fallback: number,
    min: number,
  ): number {
    const n = parseInt(raw ?? String(fallback), 10);
    if (!Number.isFinite(n) || n < min) {
      return fallback;
    }
    return n;
  }

  private todayUtcDateString(): string {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  async validateCredentials(dto: LoginDto): Promise<GymMember> {
    const username = dto.username.trim();
    const member = await this.prisma.gymMember.findFirst({
      where: { username },
    });

    if (!member?.password) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    let ok = false;
    try {
      ok = await bcrypt.compare(dto.password, member.password);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`bcrypt.compare falló (hash corrupto o no bcrypt): ${msg}`);
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }
    if (!ok) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    this.assertMemberMayLogin(member);
    return member;
  }

  async login(dto: LoginDto) {
    const member = await this.validateCredentials(dto);
    const tokens = await this.issueTokens(member);
    return {
      ...tokens,
      user: toUserProfileDto(member),
    };
  }

  async issueTokens(member: GymMember) {
    const role_name = (member.role_name ?? '').trim();
    const payloadBase = {
      sub: member.id,
      username: member.username ?? '',
      role_name,
    };

    const accessSec = this.parseJwtTtlSeconds(
      this.config.get<string>('JWT_ACCESS_SECONDS'),
      1800,
      60,
    );
    const refreshSec = this.parseJwtTtlSeconds(
      this.config.get<string>('JWT_REFRESH_SECONDS'),
      604800,
      300,
    );

    let accessToken: string;
    let refreshToken: string;
    try {
      [accessToken, refreshToken] = await Promise.all([
        this.jwt.signAsync(
          { ...payloadBase, kind: 'access' },
          { expiresIn: accessSec },
        ),
        this.jwt.signAsync(
          { ...payloadBase, kind: 'refresh' },
          { expiresIn: refreshSec },
        ),
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`JWT signAsync falló: ${msg}`);
      throw new InternalServerErrorException(
        'No se pudo crear la sesión: revisa JWT_SECRET y JWT_ACCESS_SECONDS / JWT_REFRESH_SECONDS en backend/.env.',
      );
    }

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    let decoded: JwtPayload;
    try {
      decoded = await this.jwt.verifyAsync<JwtPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Sesión inválida o expirada.');
    }

    if (decoded.kind !== 'refresh') {
      throw new UnauthorizedException('Token incorrecto.');
    }

    const member = await this.prisma.gymMember.findUnique({
      where: { id: decoded.sub },
    });

    if (!member) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    this.assertMemberMayLogin(member);
    return this.issueTokens(member);
  }

  async getProfile(userId: number): Promise<UserProfileDto> {
    const member = await this.prisma.gymMember.findUnique({
      where: { id: userId },
    });
    if (!member) {
      throw new UnauthorizedException();
    }
    this.assertMemberMayLogin(member);
    return toUserProfileDto(member);
  }
}
