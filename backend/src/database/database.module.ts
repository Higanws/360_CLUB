import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { BackupScheduler } from './backup/backup.scheduler';
import { BackupCleanupScheduler } from './backup/backup-cleanup.scheduler';
import { BackupService } from './backup/backup.service';

/**
 * Módulo unificado de persistencia:
 * - Prisma ORM como cliente único
 * - Migraciones automáticas
 * - Gestión de backups con servicios scheduled
 */
@Module({
  imports: [ConfigModule],
  providers: [
    PrismaService,
    BackupService,
    BackupScheduler,
    BackupCleanupScheduler,
  ],
  exports: [PrismaService, BackupService],
})
export class DatabaseModule implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Validar conexión + ejecutar migraciones en startup
    try {
      await this.prisma.$queryRaw`SELECT 1 AS ok`;
      console.log('[DB] ✓ Conexión a base de datos validada');
    } catch (error) {
      console.error('[DB] ✗ Error de conexión:', error);
      throw error;
    }
  }
}
