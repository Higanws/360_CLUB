import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { PrismaService } from '../database/prisma.service';

/**
 * Comprueba que el adaptador Prisma ↔ MySQL está operativo (tras instalación).
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('database')
  async database() {
    const rows = await this.prisma.$queryRaw<
      Array<{ db: string | null }>
    >`SELECT DATABASE() AS db`;
    const dbName = rows[0]?.db ?? null;
    return {
      ok: true,
      driver: 'mysql',
      database: dbName,
    };
  }
}
