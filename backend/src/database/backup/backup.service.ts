import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { PrismaService } from '../prisma.service';
import { DbMaintenanceService } from './db-maintenance.service';

const execFileAsync = promisify(execFile);

export type BackupFileInfo = {
  filename: string;
  size: number;
  modified_at: string;
};

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;
  private readonly dbContainer: string;
  private opLock = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly maintenance: DbMaintenanceService,
  ) {
    this.backupDir =
      this.config.get<string>('BACKUP_DIR')?.trim() ||
      path.resolve(process.cwd(), '..', 'Backups');
    // Si cwd es backend/, subir un nivel; si es raíz del repo, Backups ahí.
    if (!this.config.get<string>('BACKUP_DIR')?.trim()) {
      const fromBackend = path.resolve(process.cwd(), '..', 'Backups');
      const fromRoot = path.resolve(process.cwd(), 'Backups');
      this.backupDir = process.cwd().endsWith('backend')
        ? fromBackend
        : fromRoot;
    }
    this.dbContainer =
      this.config.get<string>('CLUB360_DB_CONTAINER')?.trim() || 'club360-db';
  }

  getBackupDir(): string {
    return this.backupDir;
  }

  async listBackups(): Promise<BackupFileInfo[]> {
    await fs.mkdir(this.backupDir, { recursive: true });
    const names = await fs.readdir(this.backupDir);
    const out: BackupFileInfo[] = [];
    for (const name of names) {
      if (!name.startsWith('club360_')) continue;
      if (!name.endsWith('.sql.gz') && !name.endsWith('.sql')) continue;
      const full = path.join(this.backupDir, name);
      const st = await fs.stat(full);
      if (!st.isFile()) continue;
      out.push({
        filename: name,
        size: st.size,
        modified_at: st.mtime.toISOString(),
      });
    }
    out.sort((a, b) => b.modified_at.localeCompare(a.modified_at));
    return out;
  }

  /**
   * Genera backup: app → 503 (maintenance), Prisma disconnect,
   * DB read_only + dump en contenedor, luego reconectar.
   */
  async createBackup(): Promise<BackupFileInfo> {
    this.assertIdle();
    this.opLock = true;
    const before = new Set((await this.listBackups()).map((b) => b.filename));

    try {
      this.maintenance.enter('backup', 'Generando dump SQL');
      await this.disconnectPrisma();

      await this.runInDbContainer(['/scripts/backup.sh']);

      await this.reconnectPrisma();
      this.maintenance.exit();

      const after = await this.listBackups();
      const created = after.find((b) => !before.has(b.filename));
      if (!created) {
        throw new ServiceUnavailableException(
          'El dump terminó pero no se encontró el archivo en Backups/.',
        );
      }
      this.logger.log(`Backup OK: ${created.filename}`);
      return created;
    } catch (e) {
      await this.safeRecover();
      throw e;
    } finally {
      this.opLock = false;
    }
  }

  /**
   * Restaura desde un archivo ya presente en Backups/ o subido a esa carpeta.
   * La SPA sigue arriba; /api responde 503 hasta terminar.
   */
  async restoreFromFilename(filename: string): Promise<{ filename: string }> {
    this.assertIdle();
    const safe = path.basename(filename);
    if (
      safe !== filename ||
      !safe.startsWith('club360_') ||
      !(safe.endsWith('.sql.gz') || safe.endsWith('.sql'))
    ) {
      throw new BadRequestException(
        'Nombre inválido. Usá un archivo club360_*.sql.gz de Backups/.',
      );
    }
    const full = path.join(this.backupDir, safe);
    try {
      await fs.access(full);
    } catch {
      throw new BadRequestException(`No existe ${safe} en Backups/.`);
    }

    this.opLock = true;
    try {
      this.maintenance.enter('restore', `Restaurando ${safe}`);
      await this.disconnectPrisma();

      // El archivo ya está en el bind-mount /backups del contenedor db
      await this.runInDbContainer(['/scripts/restore.sh', `/backups/${safe}`]);

      await this.reconnectPrisma();
      this.maintenance.exit();
      this.logger.log(`Restore OK: ${safe}`);
      return { filename: safe };
    } catch (e) {
      await this.safeRecover();
      throw e;
    } finally {
      this.opLock = false;
    }
  }

  async saveUploadAndRestore(
    file: Express.Multer.File,
  ): Promise<{ filename: string }> {
    if (!file?.buffer?.length && !file?.path) {
      throw new BadRequestException('Falta el archivo de backup.');
    }
    const original = path.basename(file.originalname || 'upload.sql.gz');
    if (!original.endsWith('.sql.gz') && !original.endsWith('.sql')) {
      throw new BadRequestException('Solo se aceptan .sql.gz o .sql');
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = original.startsWith('club360_')
      ? original
      : `club360_upload_${stamp}${original.endsWith('.sql.gz') ? '.sql.gz' : '.sql'}`;
    await fs.mkdir(this.backupDir, { recursive: true });
    const dest = path.join(this.backupDir, filename);
    if (file.buffer?.length) {
      await fs.writeFile(dest, file.buffer);
    } else if (file.path) {
      await fs.copyFile(file.path, dest);
    }
    return this.restoreFromFilename(filename);
  }

  private assertIdle(): void {
    if (this.opLock || this.maintenance.isActive()) {
      throw new ConflictException(
        'Ya hay un backup o restore en curso. Esperá a que termine.',
      );
    }
  }

  private async disconnectPrisma(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.logger.log('Prisma desconectado (maintenance)');
    } catch (e) {
      this.logger.warn(
        `Prisma disconnect: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  private async reconnectPrisma(): Promise<void> {
    await this.prisma.$connect();
    await this.prisma.$queryRaw`SELECT 1`;
    this.logger.log('Prisma reconectado');
  }

  private async safeRecover(): Promise<void> {
    try {
      await this.reconnectPrisma();
    } catch (e) {
      this.logger.error(
        `No se pudo reconectar Prisma: ${e instanceof Error ? e.message : e}`,
      );
    }
    this.maintenance.exit();
  }

  private async runInDbContainer(cmd: string[]): Promise<void> {
    this.logger.log(`docker exec ${this.dbContainer} ${cmd.join(' ')}`);
    try {
      const { stdout, stderr } = await execFileAsync(
        'docker',
        ['exec', this.dbContainer, ...cmd],
        {
          maxBuffer: 20 * 1024 * 1024,
          env: process.env,
        },
      );
      if (stdout?.trim()) this.logger.log(stdout.trim());
      if (stderr?.trim()) this.logger.warn(stderr.trim());
    } catch (e: unknown) {
      const err = e as { stderr?: string; message?: string };
      const msg = err.stderr?.trim() || err.message || String(e);
      this.logger.error(`docker exec falló: ${msg}`);
      throw new ServiceUnavailableException(
        `No se pudo ejecutar en ${this.dbContainer}: ${msg}`,
      );
    }
  }
}
