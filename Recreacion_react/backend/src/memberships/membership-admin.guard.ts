import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/** Alta, edición y baja de planes de membresía (solo administrador). */
@Injectable()
export class MembershipAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      user?: { role_name?: string };
    }>();
    const raw = (req.user?.role_name ?? '').trim().toLowerCase();
    if (raw !== 'administrator') {
      throw new ForbiddenException(
        'Solo el administrador puede crear, editar o eliminar membresías.',
      );
    }
    return true;
  }
}
