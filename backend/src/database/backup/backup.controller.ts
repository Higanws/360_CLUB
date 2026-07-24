import { Controller, Get, Post, Logger } from '@nestjs/common';
import { BackupService } from './backup.service';

/**
 * Endpoints para gestión manual de backups.
 * Requiere autenticación de admin (proteger con guards).
 */
@Controller('api/admin/backups')
export class BackupController {
  private readonly logger = new Logger(BackupController.name);

  constructor(private backup: BackupService) {}

  /**
   * GET /api/admin/backups/list
   * Listar todos los backups disponibles.
   */
  @Get('list')
  async listBackups() {
    try {
      const backups = await this.backup.listBackups();
      const totalSize = await this.backup.getBackupsTotalSize();

      return {
        success: true,
        data: {
          backups,
          totalSize,
          totalSizeFormatted: this.formatBytes(totalSize),
          count: backups.length,
        },
      };
    } catch (error) {
      this.logger.error(`Error listing backups: ${error}`);
      return {
        success: false,
        error: 'No se pudieron listar los backups',
      };
    }
  }

  /**
   * POST /api/admin/backups/create
   * Crear backup manual.
   */
  @Post('create')
  async createBackup() {
    try {
      const metadata = await this.backup.createBackup();
      return {
        success: true,
        data: metadata,
      };
    } catch (error) {
      this.logger.error(`Error creating backup: ${error}`);
      return {
        success: false,
        error: 'No se pudo crear el backup',
        details: error instanceof Error ? error.message : undefined,
      };
    }
  }

  /**
   * POST /api/admin/backups/cleanup
   * Ejecutar limpieza de backups antiguos.
   */
  @Post('cleanup')
  async cleanup() {
    try {
      await this.backup.cleanupOldBackups(30); // Retener 30 días
      const totalSize = await this.backup.getBackupsTotalSize();

      return {
        success: true,
        data: {
          message: 'Limpieza completada',
          totalSize,
          totalSizeFormatted: this.formatBytes(totalSize),
        },
      };
    } catch (error) {
      this.logger.error(`Error cleaning up backups: ${error}`);
      return {
        success: false,
        error: 'No se pudo ejecutar la limpieza',
      };
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
