import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SKIP_DB_MAINTENANCE_KEY } from './skip-db-maintenance.decorator';
import { DbMaintenanceService } from './db-maintenance.service';

/**
 * Bloquea el resto de la API mientras corre backup/restore.
 * La app (SPA) sigue servida; las llamadas /api fallan con 503.
 */
@Injectable()
export class DbMaintenanceGuard implements CanActivate {
  constructor(
    private readonly maintenance: DbMaintenanceService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.maintenance.isActive()) {
      return true;
    }

    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_DB_MAINTENANCE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip) {
      return true;
    }

    const status = this.maintenance.getStatus();
    throw new HttpException(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: 'Service Unavailable',
        message: `Base de datos en mantenimiento (${status.mode}). Reintentá en unos momentos.`,
        maintenance: status,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
