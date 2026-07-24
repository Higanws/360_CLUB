import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Servicio de cliente Prisma global.
 * - Gestiona ciclo de vida
 * - Ejecuta migraciones
 * - Hooks para logging en desarrollo
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    // Ejecutar migraciones pendientes
    if (process.env.SKIP_MIGRATIONS !== 'true') {
      try {
        // Las migraciones se ejecutan via CLI en Docker/producción:
        // `prisma migrate deploy`
        // En desarrollo con --watch, no ejecutar automáticamente
        if (process.env.NODE_ENV !== 'development') {
          console.log(
            '[Prisma] Migraciones: esperando `prisma migrate deploy` en CLI',
          );
        }
      } catch (error) {
        console.error('[Prisma] Error en setup:', error);
        throw error;
      }
    }

    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
