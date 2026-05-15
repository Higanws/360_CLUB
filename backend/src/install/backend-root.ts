import { join } from 'path';

/**
 * Carpeta del paquete Nest (`backend/`): `.env`, `data/`, `dist/`.
 * No usar solo `process.cwd()` porque el proceso puede arrancar desde el monorepo.
 *
 * En desarrollo (`nest start --watch`) el código vive en `src/…` → subir dos niveles.
 * Tras `nest build`, este fichero queda en `dist/src/install/…` → subir **tres** niveles
 * hasta la raíz del paquete `backend/`, no `backend/dist/`.
 */
export function backendPackageRoot(): string {
  const normalized = __dirname.replace(/\\/g, '/');
  if (/\/dist\/src\//.test(normalized)) {
    return join(__dirname, '..', '..', '..');
  }
  return join(__dirname, '..', '..');
}

export function backendDataDirectory(): string {
  return join(backendPackageRoot(), 'data');
}
