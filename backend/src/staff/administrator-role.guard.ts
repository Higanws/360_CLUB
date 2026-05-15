import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/** Solo rol `administrator` (POS, cobros, altas de socios, personal, dashboard, recepción). */
@Injectable()
export class AdministratorRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      user?: { role_name?: string };
    }>();
    const raw = (req.user?.role_name ?? '').trim().toLowerCase();
    if (raw !== 'administrator') {
      throw new ForbiddenException(
        'Esta función es solo para administradores del club.',
      );
    }
    return true;
  }
}
