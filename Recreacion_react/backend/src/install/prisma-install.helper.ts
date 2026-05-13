import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Connection } from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';
import { backendPackageRoot } from './backend-root';

/** Copia de `process.env` solo con valores string (requisito estable de `spawn`). */
function stringProcessEnv(overrides: Record<string, string>): NodeJS.ProcessEnv {
  const out: NodeJS.ProcessEnv = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === 'string') out[k] = v;
  }
  Object.assign(out, overrides);
  return out;
}

/** URL para `prisma migrate deploy` (mismo formato que en `services/database` y `.env.example`). */
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
 * Elimina todas las tablas de la base actual y el historial de Prisma, para que
 * `prisma migrate deploy` pueda aplicar de nuevo la migración baseline sobre BD vacía.
 */
export async function dropAllTablesInDatabase(conn: Connection): Promise<void> {
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

/**
 * Ejecuta `prisma migrate deploy` con el `DATABASE_URL` dado (cwd = paquete backend).
 *
 * Con el repo en estado **baseline único**, `deploy` crea todo el esquema MVP de una vez;
 * los datos de prueba los aporta el seed SQL del asistente, no Prisma seed.
 *
 * Preferimos `node …/node_modules/prisma/build/index.js` en **cualquier SO**: evita depender
 * de `npx`/shims del PATH y es más estable en CI y en equipos Windows (donde `spawn` sobre
 * `.cmd` sin shell a veces devuelve EINVAL).
 *
 * Si no existiera el CLI local, se usa `npx`; en Windows ese fallback usa `shell: true`
 * porque sin shell `npx` suele ser un `.cmd` problemático para `child_process.spawn`.
 */
export function runPrismaMigrateDeploy(databaseUrl: string): Promise<void> {
  const cwd = backendPackageRoot();
  const env = stringProcessEnv({ DATABASE_URL: databaseUrl });
  const prismaCli = join(cwd, 'node_modules', 'prisma', 'build', 'index.js');
  const useNodeCli = existsSync(prismaCli);
  const command = useNodeCli ? process.execPath : 'npx';
  const args = useNodeCli
    ? [prismaCli, 'migrate', 'deploy']
    : ['prisma', 'migrate', 'deploy'];
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      windowsHide: true,
      // Fallback `npx` en Windows: suele resolverse a `.cmd`; con shell evita fallos de spawn.
      ...(!useNodeCli && process.platform === 'win32' ? { shell: true } : {}),
    });
    let stderr = '';
    let stdout = '';
    child.stdout?.on('data', (c: Buffer) => {
      stdout += c.toString();
    });
    child.stderr?.on('data', (c: Buffer) => {
      stderr += c.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else {
        const tail = (stderr || stdout).trim().slice(-4000);
        reject(
          new Error(
            `prisma migrate deploy terminó con código ${code}. ` +
              (tail ? `Salida: ${tail}` : ''),
          ),
        );
      }
    });
  });
}
