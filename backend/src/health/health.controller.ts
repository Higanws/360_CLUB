import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { DataSource } from 'typeorm';

/**
 * Comprueba que el adaptador TypeORM ↔ MySQL está operativo (tras instalación).
 */
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get('database')
  async database() {
    await this.dataSource.query('SELECT 1 AS ok');
    const dbName = this.dataSource.options.database ?? null;
    return {
      ok: true,
      driver: 'mysql',
      database: dbName,
    };
  }
}
