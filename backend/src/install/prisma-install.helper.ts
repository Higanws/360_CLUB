import type { Connection } from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';

/** URL MySQL (`.env` / wizard). Prisma solo genera cliente; el esquema vive en `database/schema/`. */
export function buildPrismaDatabaseUrl(params: {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}): string {
  const u = encodeURIComponent(params.username);
  const p = encodeURIComponent(params.password);
  const db = params.database.trim();
  return `mysql://${u}:${p}@${params.host}:${params.port}/${db}`;
}

/**
 * Borra todas las vistas y tablas de la base actual.
 * Orden: vistas, luego tablas con `FOREIGN_KEY_CHECKS=0`.
 */
export async function dropAllTablesInDatabase(conn: Connection): Promise<void> {
  const [viewRows] = await conn.query<RowDataPacket[]>(
    `SELECT TABLE_NAME AS n FROM information_schema.VIEWS
     WHERE TABLE_SCHEMA = DATABASE()`,
  );
  for (const r of viewRows ?? []) {
    const name = String(r.n ?? '').trim();
    if (name.length > 0) {
      await conn.query(`DROP VIEW IF EXISTS \`${name.replace(/`/g, '``')}\``);
    }
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT TABLE_NAME AS n FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'`,
    );
    const names = (rows ?? [])
      .map((r) => String(r.n ?? '').trim())
      .filter((n) => n.length > 0);
    for (const name of names) {
      await conn.query(`DROP TABLE IF EXISTS \`${name.replace(/`/g, '``')}\``);
    }
  } finally {
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  }
}

/** Tras DROP: debe quedar 0 tablas y 0 vistas antes de aplicar schema + seed SQL. */
export async function assertDatabaseHasNoBaseTables(conn: Connection): Promise<void> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'`,
  );
  const n = Number((rows as RowDataPacket[])[0]?.c ?? -1);
  if (n !== 0) {
    throw new Error(
      `Tras vaciar la base se esperaban 0 tablas; quedan ${n}. Cierra otras sesiones que creen tablas y reintenta.`,
    );
  }
  const [vrows] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM information_schema.VIEWS
     WHERE TABLE_SCHEMA = DATABASE()`,
  );
  const v = Number((vrows as RowDataPacket[])[0]?.c ?? -1);
  if (v !== 0) {
    throw new Error(
      `Tras vaciar la base se esperaban 0 vistas; quedan ${v}. Elimínalas manualmente o reintenta.`,
    );
  }
}
