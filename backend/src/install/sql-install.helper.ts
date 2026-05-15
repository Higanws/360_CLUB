import { readFileSync } from 'fs';
import type { Connection } from 'mysql2/promise';
import { resolveDatabaseArtifact } from '../infrastructure/database/database-artifacts';

/** Marcador de la sección DDL en `schema/schema_mysql.sql` (sin TRUNCATE). */
const SCHEMA_DDL_MARKER =
  '-- =============================================================================\n-- Esquema';

function readArtifact(...segments: string[]): string {
  return readFileSync(resolveDatabaseArtifact(...segments), 'utf8');
}

/** Ejecuta un script SQL con `multipleStatements` habilitado en la conexión. */
export async function executeSqlScript(
  conn: Connection,
  sql: string,
): Promise<void> {
  await conn.query('SET NAMES utf8mb4');
  await conn.query(sql);
}

/** Solo CREATE TABLE (BD vacía tras DROP del wizard). */
export async function applyMvpSchemaDdl(conn: Connection): Promise<void> {
  const full = readArtifact('schema', 'schema_mysql.sql');
  const i = full.indexOf(SCHEMA_DDL_MARKER);
  if (i < 0) {
    throw new Error(
      'schema_mysql.sql: no se encontró la sección «Esquema». Revisa el marcador en el archivo.',
    );
  }
  await executeSqlScript(conn, full.slice(i));
}

/** Datos demo MVP (`database/seed/seed_mvp.sql`). */
export async function applyMvpSeed(conn: Connection): Promise<void> {
  await executeSqlScript(conn, readArtifact('seed', 'seed_mvp.sql'));
}

/** Esquema completo (TRUNCATE + DDL) + seed — desarrollo / `npm run db:seed`. */
export async function applyMvpSchemaAndSeed(conn: Connection): Promise<void> {
  await executeSqlScript(conn, readArtifact('schema', 'schema_mysql.sql'));
  await applyMvpSeed(conn);
}
