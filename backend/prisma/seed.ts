/**
 * Desarrollo: `npm run db:seed` — TRUNCATE + DDL (`schema_mysql.sql`) + datos demo (`seed_mvp.sql`).
 * El wizard de instalación usa el mismo seed tras DROP total (solo DDL + seed, sin TRUNCATE).
 */
import { config } from 'dotenv';
import { join } from 'path';
import { createConnection } from 'mysql2/promise';
import { applyMvpSchemaAndSeed } from '../src/install/sql-install.helper';

config({ path: join(__dirname, '..', '.env') });

async function main(): Promise<void> {
  const conn = await createConnection({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 3306),
    user: process.env.DATABASE_USER ?? 'root',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME ?? '360_test',
    multipleStatements: true,
  });
  try {
    await applyMvpSchemaAndSeed(conn);
    console.log('[db:seed] schema_mysql.sql + seed_mvp.sql aplicados.');
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
