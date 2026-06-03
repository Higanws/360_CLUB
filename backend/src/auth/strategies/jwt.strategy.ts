import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { GymMember } from '../../entities/gym-member.entity';
import { normalizeClubRole } from '../../shared/domain/club/club-roles';
import { AuthService, JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly auth: AuthService,
    @InjectRepository(GymMember)
    private readonly members: Repository<GymMember>,
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
    const member = await this.members.findOne({
      where: { id: payload.sub },
      select: ['id', 'username', 'role_name', 'activated', 'password'],
    });
    if (!member) {
      throw new UnauthorizedException('Sesión inválida.');
    }

    try {
      this.auth.assertMemberMayLogin(member);
    } catch {
      throw new UnauthorizedException('Cuenta no disponible.');
    }

    const role_name = normalizeClubRole(member.role_name);
    if (role_name !== normalizeClubRole(payload.role_name)) {
      throw new UnauthorizedException('Sesión obsoleta; vuelve a iniciar sesión.');
    }

    return {
      userId: member.id,
      username: member.username ?? '',
      role_name,
    };
  }
}
