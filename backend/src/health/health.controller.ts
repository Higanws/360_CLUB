import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';

/**
 * Comprueba que el adaptador TypeORM ↔ MySQL está operativo (tras instalación).
 */
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('database')
  async database() {
    try {
      await this.dataSource.query('SELECT 1 AS ok');
      const dbName = this.dataSource.options.database ?? null;
      let smoke: {
        gymMemberCount: number;
        adminId1Username: string | null;
        adminPasswordHashLen: number | null;
        adminBcryptPrefixOk: boolean;
      } | null = null;
      try {
        const cntRows = (await this.dataSource.query(
          'SELECT COUNT(*) AS c FROM gym_member',
        )) as { c: number | string }[];
        const gymMemberCount = Number(cntRows[0]?.c ?? 0);
        const adminRows = (await this.dataSource.query(
          'SELECT username, CHAR_LENGTH(password) AS plen FROM gym_member WHERE id = 1 LIMIT 1',
        )) as { username: string | null; plen: number | string | null }[];
        const ar = adminRows[0];
        const plen = ar?.plen != null ? Number(ar.plen) : null;
        const pfxRows = (await this.dataSource.query(
          'SELECT LEFT(password, 3) AS p FROM gym_member WHERE id = 1 LIMIT 1',
        )) as { p: string | null }[];
        const p = pfxRows[0]?.p ?? '';
        smoke = {
          gymMemberCount,
          adminId1Username: ar?.username ?? null,
          adminPasswordHashLen: plen,
          adminBcryptPrefixOk: p === '$2a' || p === '$2b' || p === '$2y',
        };
      } catch {
        smoke = null;
      }
      return {
        ok: true,
        driver: 'mysql',
        database: dbName,
        smoke,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new ServiceUnavailableException({
        ok: false,
        driver: 'mysql',
        error: msg,
      });
    }
  }
}
