import {
  Controller,
  Get,
  Post,
  Body,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsOptional, IsString } from 'class-validator';
import { memoryStorage } from 'multer';
import { AdministratorRoleGuard } from '../../staff/administrator-role.guard';
import { BackupService } from './backup.service';
import { DbMaintenanceService } from './db-maintenance.service';
import { SkipDbMaintenance } from './skip-db-maintenance.decorator';

class RestoreBodyDto {
  @IsOptional()
  @IsString()
  filename?: string;
}

@Controller('admin/backups')
@UseGuards(AdministratorRoleGuard)
@SkipDbMaintenance()
export class BackupController {
  constructor(
    private readonly backups: BackupService,
    private readonly maintenance: DbMaintenanceService,
  ) {}

  /** Estado de mantenimiento / cola (no hay cola offline). */
  @Get('status')
  status() {
    return {
      ...this.maintenance.getStatus(),
      backup_dir: this.backups.getBackupDir(),
    };
  }

  @Get()
  async list() {
    return { items: await this.backups.listBackups() };
  }

  /** Genera un dump; durante la operación el resto de /api responde 503. */
  @Post()
  async create() {
    const file = await this.backups.createBackup();
    return { ok: true, backup: file };
  }

  /**
   * Restaura desde un archivo ya en Backups/ (`filename`)
   * o subiendo multipart `file` (.sql.gz).
   */
  @Post('restore')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 512 * 1024 * 1024 },
    }),
  )
  async restore(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: RestoreBodyDto,
  ) {
    if (file) {
      const result = await this.backups.saveUploadAndRestore(file);
      return { ok: true, restored: result.filename };
    }
    if (body?.filename?.trim()) {
      const result = await this.backups.restoreFromFilename(
        body.filename.trim(),
      );
      return { ok: true, restored: result.filename };
    }
    throw new BadRequestException(
      'Enviá multipart field `file` o JSON `{ "filename": "club360_….sql.gz" }`.',
    );
  }
}
