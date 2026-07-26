import { Injectable } from '@nestjs/common';

export type DbMaintenanceMode = 'open' | 'backup' | 'restore';

/**
 * Estado en memoria: cuando no es `open`, la API responde 503
 * (excepto rutas @SkipDbMaintenance) y Prisma se desconecta.
 * No hay cola de escrituras pendientes: el cliente debe reintentar.
 */
@Injectable()
export class DbMaintenanceService {
  private mode: DbMaintenanceMode = 'open';
  private startedAt: number | null = null;
  private detail: string | null = null;

  getMode(): DbMaintenanceMode {
    return this.mode;
  }

  isActive(): boolean {
    return this.mode !== 'open';
  }

  getStatus() {
    return {
      mode: this.mode,
      active: this.isActive(),
      started_at: this.startedAt
        ? new Date(this.startedAt).toISOString()
        : null,
      detail: this.detail,
      queue: false as const,
      note: this.isActive()
        ? 'La app sigue arriba; la API responde 503 sin usar la BD. No hay cola offline: reintentá al terminar.'
        : null,
    };
  }

  enter(mode: 'backup' | 'restore', detail?: string): void {
    if (this.mode !== 'open') {
      throw new Error(`Ya hay mantenimiento activo (${this.mode}).`);
    }
    this.mode = mode;
    this.startedAt = Date.now();
    this.detail = detail ?? null;
  }

  exit(): void {
    this.mode = 'open';
    this.startedAt = null;
    this.detail = null;
  }
}
