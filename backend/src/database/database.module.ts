import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './prisma.service';
import { BackupService } from './backup/backup.service';
import { BackupController } from './backup/backup.controller';
import { DbMaintenanceService } from './backup/db-maintenance.service';
import { DbMaintenanceGuard } from './backup/db-maintenance.guard';

/**
 * Persistencia Prisma + API de backups (admin).
 * Durante backup/restore: maintenance → 503 en el resto de la API.
 * No hay cola de requests offline; el cliente debe reintentar.
 */
@Global()
@Module({
  controllers: [BackupController],
  providers: [
    PrismaService,
    DbMaintenanceService,
    BackupService,
    { provide: APP_GUARD, useClass: DbMaintenanceGuard },
  ],
  exports: [PrismaService, DbMaintenanceService, BackupService],
})
export class DatabaseModule {}
