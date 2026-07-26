import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { GymMember } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DbMaintenanceService } from '../../database/backup/db-maintenance.service';
import { normalizeClubRole } from '../../shared/domain/club/club-roles';
import { AuthService, JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly maintenance: DbMaintenanceService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if (process.env.NODE_ENV === 'production' && !secret) {
      throw new Error('JWT_SECRET es obligatorio en producción.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret ?? 'dev-secret-change-me',
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.kind !== 'access') {
      throw new UnauthorizedException();
    }

    // Durante backup/restore Prisma está desconectado: confiar en el JWT
    // para rutas @SkipDbMaintenance (admin/backups).
    if (this.maintenance.isActive()) {
      return {
        userId: payload.sub,
        username: payload.username,
        role_name: normalizeClubRole(payload.role_name),
      };
    }

    const member = await this.prisma.gymMember.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        role_name: true,
        activated: true,
        password: true,
      },
    });
    if (!member) {
      throw new UnauthorizedException('Sesión inválida.');
    }

    try {
      this.auth.assertMemberMayLogin(member as GymMember);
    } catch {
      throw new UnauthorizedException('Cuenta no disponible.');
    }

    const role_name = normalizeClubRole(member.role_name);
    if (role_name !== normalizeClubRole(payload.role_name)) {
      throw new UnauthorizedException(
        'Sesión obsoleta; vuelve a iniciar sesión.',
      );
    }

    return {
      userId: member.id,
      username: member.username ?? '',
      role_name,
    };
  }
}
