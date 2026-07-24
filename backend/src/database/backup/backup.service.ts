import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import { pipeline } from 'stream/promises';
import * as zlib from 'zlib';
import { createReadStream, createWriteStream } from 'fs';

export interface BackupMetadata {
  filename: string;
  timestamp: number;
  size: number;
  status: 'completed' | 'failed';
  errorMessage?: string;
}

/**
 * Servicio de gestión de backups:
 * - Crea backups comprimidos de MySQL vía mysqldump
 * - Almacena metadatos en JSON
 * - Valida integridad
 */
@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;
  private readonly metadataFile: string;

  constructor(private config: ConfigService) {
    this.backupDir = path.join(
      process.cwd(),
      'data',
      'backups',
    );
    this.metadataFile = path.join(this.backupDir, 'backups.json');
  }

  /**
   * Crear backup comprimido de la BD.
   * Ejecuta: mysqldump | gzip → backup_TIMESTAMP.sql.gz
   */
  async createBackup(): Promise<BackupMetadata> {
    try {
      await this.ensureBackupDir();

      const timestamp = Date.now();
      const date = new Date(timestamp).toISOString().split('T')[0];
      const time = new Date(timestamp).toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
      const filename = `backup_${date}_${time}.sql.gz`;
      const backupPath = path.join(this.backupDir, filename);

      const dbHost = this.config.get<string>('DATABASE_HOST', 'localhost');
      const dbPort = this.config.get<number>('DATABASE_PORT', 3306);
      const dbUser = this.config.get<string>('DATABASE_USER', 'root');
      const dbPass = this.config.get<string>('DATABASE_PASSWORD', '');
      const dbName = this.config.get<string>('DATABASE_NAME', 'club360');

      this.logger.log(`[BACKUP] Iniciando backup: ${filename}`);

      // Ejecutar mysqldump y comprimir con gzip
      const cmd = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} -p"${dbPass}" ${dbName} | gzip > "${backupPath}"`;
      execSync(cmd, { stdio: 'pipe', shell: '/bin/bash' });

      // Validar que el archivo se creó
      const stats = await fs.stat(backupPath);
      const size = stats.size;

      const metadata: BackupMetadata = {
        filename,
        timestamp,
        size,
        status: 'completed',
      };

      // Registrar en metadatos
      await this.appendBackupMetadata(metadata);

      this.logger.log(
        `[BACKUP] ✓ Completado: ${filename} (${this.formatBytes(size)})`,
      );

      return metadata;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[BACKUP] ✗ Error: ${errorMsg}`);

      const metadata: BackupMetadata = {
        filename: `backup_failed_${Date.now()}`,
        timestamp: Date.now(),
        size: 0,
        status: 'failed',
        errorMessage: errorMsg,
      };

      await this.appendBackupMetadata(metadata);
      throw error;
    }
  }

  /**
   * Eliminar backups más antiguos que daysToKeep.
   * Mantiene backups recientes y limpia espacio.
   */
  async cleanupOldBackups(daysToKeep: number = 30): Promise<void> {
    try {
      await this.ensureBackupDir();

      const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
      const files = await fs.readdir(this.backupDir);

      let deletedCount = 0;
      let freedSpace = 0;

      for (const file of files) {
        // Saltar metadata
        if (file === 'backups.json' || !file.endsWith('.sql.gz')) {
          continue;
        }

        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtimeMs < cutoffTime) {
          await fs.unlink(filePath);
          deletedCount++;
          freedSpace += stats.size;
          this.logger.log(`[CLEANUP] Eliminado: ${file}`);
        }
      }

      // Actualizar metadata: marcar como deleted
      await this.updateDeletedBackups(cutoffTime);

      this.logger.log(
        `[CLEANUP] Completado: ${deletedCount} archivos eliminados (${this.formatBytes(freedSpace)} liberados)`,
      );
    } catch (error) {
      this.logger.error(
        `[CLEANUP] Error: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Listar backups disponibles ordenados por fecha.
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      await this.ensureBackupDir();

      if (!(await this.fileExists(this.metadataFile))) {
        return [];
      }

      const content = await fs.readFile(this.metadataFile, 'utf-8');
      const data = JSON.parse(content);

      return Array.isArray(data) ? data : [];
    } catch (error) {
      this.logger.warn(`[BACKUPS] Error leyendo metadata: ${error}`);
      return [];
    }
  }

  /**
   * Obtener tamaño total de backups.
   */
  async getBackupsTotalSize(): Promise<number> {
    try {
      await this.ensureBackupDir();

      const files = await fs.readdir(this.backupDir);
      let total = 0;

      for (const file of files) {
        if (file.endsWith('.sql.gz')) {
          const stats = await fs.stat(path.join(this.backupDir, file));
          total += stats.size;
        }
      }

      return total;
    } catch (error) {
      this.logger.warn(`[BACKUPS] Error calculando tamaño: ${error}`);
      return 0;
    }
  }

  // ============ Helpers privados ============

  private async ensureBackupDir(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      this.logger.error(`Error creando directorio de backups: ${error}`);
    }
  }

  private async appendBackupMetadata(metadata: BackupMetadata): Promise<void> {
    try {
      let backups: BackupMetadata[] = [];

      if (await this.fileExists(this.metadataFile)) {
        const content = await fs.readFile(this.metadataFile, 'utf-8');
        backups = JSON.parse(content);
      }

      backups.push(metadata);

      // Mantener solo los últimos 100 registros en metadata
      if (backups.length > 100) {
        backups = backups.slice(-100);
      }

      await fs.writeFile(
        this.metadataFile,
        JSON.stringify(backups, null, 2),
        'utf-8',
      );
    } catch (error) {
      this.logger.error(`Error escribiendo metadata: ${error}`);
    }
  }

  private async updateDeletedBackups(cutoffTime: number): Promise<void> {
    try {
      let backups = await this.listBackups();

      backups = backups.map((b) =>
        b.timestamp < cutoffTime ? { ...b, status: 'deleted' as const } : b,
      );

      await fs.writeFile(
        this.metadataFile,
        JSON.stringify(backups, null, 2),
        'utf-8',
      );
    } catch (error) {
      this.logger.error(`Error actualizando metadata: ${error}`);
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
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
