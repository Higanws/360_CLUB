import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class BusinessRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowed =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (!allowed.length) return true;

    const req = context.switchToHttp().getRequest<{
      user?: { role_name?: string };
    }>();
    const raw = (req.user?.role_name ?? '').trim().toLowerCase();
    const ok = allowed.some((r) => r.toLowerCase() === raw);
    if (!ok) {
      throw new ForbiddenException(
        'Esta área es solo para personal del club (administración o staff).',
      );
    }
    return true;
  }
}
