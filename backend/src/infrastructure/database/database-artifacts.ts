import { existsSync } from 'fs';
import { join } from 'path';
import { backendPackageRoot } from '../../install/backend-root';

/** Raíz de artefactos SQL versionados (`backend/database/`). */
export function databaseArtifactsRoot(): string {
  return join(backendPackageRoot(), 'database');
}

/**
 * Ruta absoluta a un archivo bajo `backend/database/`.
 * @example resolveDatabaseArtifact('schema', 'schema_mysql.sql')
 */
export function resolveDatabaseArtifact(
  ...segments: string[]
): string {
  const path = join(databaseArtifactsRoot(), ...segments);
  if (existsSync(path)) return path;
  return path;
}

/** Artefactos SQL versionados bajo `backend/database/`. */
export const DATABASE_ARTIFACT_PATHS = {
  /** Vaciado (opcional) + DDL — sin datos demo. */
  schemaMysql: 'schema/schema_mysql.sql',
  /** INSERTs de población demo (única fuente). */
  seedMvp: 'seed/seed_mvp.sql',
} as const;
