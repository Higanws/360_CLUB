import { existsSync } from 'fs';
import { join } from 'path';
import { backendDataDirectory } from './backend-root';

/**
 * Indica que el asistente de instalación ya terminó correctamente (BD + migración baseline con demo + `.env`).
 *
 * **Marcadores** (cualquiera basta) en `backend/data/`:
 * - `installed.txt` — legible; fecha de cierre del asistente
 * - `.installed` — oculto; compatibilidad con versiones anteriores
 *
 * Mientras **no** existan, la API Nest solo expone `/api/install/*` (sin login ni TypeORM).
 * Tras completar el asistente **hay que reiniciar el proceso del backend** una vez: los
 * módulos de negocio se cargan al arranque según estos marcadores.
 *
 * **Volver a ejecutar el wizard desde cero** (solo manual):
 * 1. Borra `backend/data/installed.txt` y `backend/data/.installed`.
 * 2. Opcional: borra o renombra `backend/.env` y vacía/recrea la BD si quieres instalación limpia.
 * 3. Reinicia el backend → verás de nuevo el asistente en el navegador.
 *    (En este repo puedes usar `.\club360.ps1 -ResetInstall` desde `Recreacion_react` para los pasos 1–2.)
 * El asistente hace `DROP` de **todas** las vistas y tablas (cualquier dato o esquema antiguo),
 * comprueba **0 tablas y 0 vistas**, ejecuta `prisma migrate deploy` (baseline con **población inicial**)
 * y valida que esa población exista antes de fijar el administrador.
 */
function candidateInstallDataDirs(): string[] {
  const dirs = new Set<string>();
  dirs.add(backendDataDirectory());
  dirs.add(join(process.cwd(), 'data'));
  dirs.add(join(process.cwd(), 'backend', 'data'));
  return [...dirs];
}

export function isInstallComplete(): boolean {
  try {
    for (const dir of candidateInstallDataDirs()) {
      if (
        existsSync(join(dir, 'installed.txt')) ||
        existsSync(join(dir, '.installed'))
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
