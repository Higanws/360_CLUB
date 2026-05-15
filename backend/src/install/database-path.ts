import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Localiza `Recreacion_react/database/<...segmentos>` aunque `cwd` sea `backend`,
 * la raíz del monorepo u otro directorio de trabajo.
 *
 * @example resolveRepoDatabaseFile('schema', 'schema_mysql.sql')
 */
export function resolveRepoDatabaseFile(
  ...relativePathFromDatabaseDir: string[]
): string {
  const sub = join(...relativePathFromDatabaseDir);
  const candidates = [
    join(process.cwd(), '..', 'database', sub),
    join(process.cwd(), 'database', sub),
    join(__dirname, '..', '..', '..', 'database', sub),
    join(__dirname, '..', '..', '..', '..', 'database', sub),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return candidates[0];
}
