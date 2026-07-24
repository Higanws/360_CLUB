import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BackupService } from './backup.service';

/**
 * Servicio scheduled que limpia backups antiguos.
 * - Se ejecuta diariamente a una hora configurable
 * - Retiene backups de los últimos N días (configurable)
 * - Deshabilitable con BACKUP_CLEANUP_ENABLED=false
 */
@Injectable()
export class BackupCleanupScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BackupCleanupScheduler.name);
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private backup: BackupService,
    private config: ConfigService,
  ) {}

  onModuleInit(): void {
    const enabled = this.config.get<string>(
      'BACKUP_CLEANUP_ENABLED',
      'true',
    ) !== 'false';
    if (!enabled) {
      this.logger.warn('[CLEANUP SCHEDULER] Deshabilitado (BACKUP_CLEANUP_ENABLED=false)');
      return;
    }

    this.scheduleCleanup();
  }

  onModuleDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.logger.log('[CLEANUP SCHEDULER] Detenido');
    }
  }

  private scheduleCleanup(): void {
    // Calcular tiempo hasta próxima ejecución (2:00 AM)
    const now = new Date();
    const cleanupHour = this.config.get<number>('BACKUP_CLEANUP_HOUR', 2);

    let next = new Date();
    next.setHours(cleanupHour, 0, 0, 0);

    // Si ya pasó la hora hoy, programar para mañana
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    const delay = next.getTime() - now.getTime();

    // Ejecutar en la hora configurada
    setTimeout(() => {
      this.executeCleanup();
      // Luego cada 24 horas
      this.intervalId = setInterval(
        () => this.executeCleanup(),
        24 * 60 * 60 * 1000,
      );
    }, delay);

    const timeStr = next.toLocaleTimeString('es-ES');
    this.logger.log(
      `[CLEANUP SCHEDULER] Activado: próxima ejecución a las ${timeStr}`,
    );
  }

  private async executeCleanup(): Promise<void> {
    try {
      const daysToKeep = this.config.get<number>('BACKUP_DAYS_TO_KEEP', 30);
      this.logger.log(
        `[CLEANUP SCHEDULER] Ejecutando limpieza (retener ${daysToKeep} días)...`,
      );
      
      await this.backup.cleanupOldBackups(daysToKeep);
      
      const totalSize = await this.backup.getBackupsTotalSize();
      this.logger.log(
        `[CLEANUP SCHEDULER] ✓ Completado. Tamaño total de backups: ${this.formatBytes(totalSize)}`,
      );
    } catch (error) {
      this.logger.error(
        `[CLEANUP SCHEDULER] ✗ Error: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
