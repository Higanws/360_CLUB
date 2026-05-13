import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/** Solo el rol administrador puede dar de alta/editar/baja personal. */
@Injectable()
export class AdministratorRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      user?: { role_name?: string };
    }>();
    const raw = (req.user?.role_name ?? '').trim().toLowerCase();
    if (raw !== 'administrator') {
      throw new ForbiddenException(
        'Solo el administrador puede crear, editar o eliminar personal del club.',
      );
    }
    return true;
  }
}
