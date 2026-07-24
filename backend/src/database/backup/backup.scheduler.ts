import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BackupService } from './backup.service';

/**
 * Servicio scheduled que ejecuta backups automáticos.
 * - Intervalo configurable vía BACKUP_INTERVAL_MINUTES
 * - Valor por defecto: 360 minutos (6 horas)
 * - Deshabilitable con BACKUPS_ENABLED=false
 */
@Injectable()
export class BackupScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BackupScheduler.name);
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private backup: BackupService,
    private config: ConfigService,
  ) {}

  onModuleInit(): void {
    const enabled = this.config.get<string>('BACKUPS_ENABLED', 'true') !== 'false';
    if (!enabled) {
      this.logger.warn('[BACKUP SCHEDULER] Deshabilitado (BACKUPS_ENABLED=false)');
      return;
    }

    this.scheduleBackup();
  }

  onModuleDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.logger.log('[BACKUP SCHEDULER] Detenido');
    }
  }

  private scheduleBackup(): void {
    // Ejecutar inmediatamente al iniciar
    this.executeBackup();

    // Luego cada N minutos
    const intervalMinutes = this.config.get<number>(
      'BACKUP_INTERVAL_MINUTES',
      360, // 6 horas por defecto
    );

    this.intervalId = setInterval(
      () => this.executeBackup(),
      intervalMinutes * 60 * 1000,
    );

    this.logger.log(
      `[BACKUP SCHEDULER] Activado: backup cada ${intervalMinutes} minutos`,
    );
  }

  private async executeBackup(): Promise<void> {
    try {
      this.logger.log('[BACKUP SCHEDULER] Ejecutando backup...');
      const metadata = await this.backup.createBackup();
      this.logger.log(
        `[BACKUP SCHEDULER] ✓ Backup completado: ${metadata.filename}`,
      );
    } catch (error) {
      this.logger.error(
        `[BACKUP SCHEDULER] ✗ Error: ${error instanceof Error ? error.message : error}`,
      );
      // No lanzar para evitar detener el scheduler
    }
  }
}
