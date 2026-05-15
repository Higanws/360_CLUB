import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { api } from './lib/api';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import { InstallWizard } from './pages/InstallWizard';

type Phase =
  | 'loading'
  | 'api-error'
  | 'needs-install'
  | 'needs-backend-restart'
  | 'ready';

const STATUS_ATTEMPTS = 30;
const STATUS_DELAY_MS = 400;

/**
 * Tras escribir `data/installed.txt`, Nest **no recarga** Auth/TypeORM en caliente:
 * hace falta reiniciar el proceso. Comprobamos endpoints que solo existen con el stack completo.
 */
async function isApiFullyBooted(): Promise<boolean> {
  try {
    const res = await api.get<{ ok?: boolean }>('/health/database');
    if (res.status === 200 && res.data?.ok === true) {
      return true;
    }
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 503) {
      return true;
    }
  }

  try {
    await api.get('/auth/me');
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const s = e.response?.status;
      /** Ruta montada: sin JWT el guard responde 401 (u ocasionalmente 403). */
      if (s === 401 || s === 403) {
        return true;
      }
    }
  }

  try {
    const res = await api.get('/settings/branding');
    return res.status === 200;
  } catch {
    return false;
  }
}

export function RootApp() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [bootDetail, setBootDetail] = useState<string | null>(null);

  const probeBackend = useCallback(async (): Promise<Phase> => {
    let installed = false;
    let gotStatus = false;
    for (let i = 0; i < STATUS_ATTEMPTS; i++) {
      if (i > 0) {
        setBootDetail(`Conectando con la API (${i + 1}/${STATUS_ATTEMPTS})…`);
      }
      try {
        const res = await api.get<{ installed: boolean }>('/install/status');
        installed = !!res.data?.installed;
        gotStatus = true;
        break;
      } catch {
        if (i < STATUS_ATTEMPTS - 1) {
          await new Promise((r) => setTimeout(r, STATUS_DELAY_MS));
        }
      }
    }

    if (!gotStatus) {
      return 'api-error';
    }

    if (!installed) {
      return 'needs-install';
    }

    const booted = await isApiFullyBooted();
    return booted ? 'ready' : 'needs-backend-restart';
  }, [setBootDetail]);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setBootDetail('Conectando con la API…');
      const next = await probeBackend();
      if (!alive) return;
      setBootDetail(null);
      setPhase(next);
    };

    void run();

    return () => {
      alive = false;
    };
  }, [probeBackend]);

  async function retryAfterRestart() {
    setPhase('loading');
    setBootDetail('Comprobando de nuevo…');
    const next = await probeBackend();
    setBootDetail(null);
    setPhase(next);
  }

  if (phase === 'loading') {
    return (
      <div className="boot-screen">
        <p>Iniciando Club360…</p>
        {bootDetail ? <p className="muted">{bootDetail}</p> : null}
      </div>
    );
  }

  if (phase === 'api-error') {
    return (
      <div className="boot-screen boot-screen--error">
        <p>
          No hay conexión con la API tras varios intentos. Arranca el backend en{' '}
          <code>Recreacion_react/backend</code> con{' '}
          <code>npm run start:dev</code> y recarga esta página.
        </p>
        <p className="muted">
          Con Vite en desarrollo, el navegador llama a <code>/api</code> y el proxy
          reenvía al puerto del backend (por defecto <code>3000</code>).
        </p>
      </div>
    );
  }

  if (phase === 'needs-install') {
    return <InstallWizard />;
  }

  if (phase === 'needs-backend-restart') {
    return (
      <div className="boot-screen boot-screen--error">
        <h1 className="boot-screen-title">Reinicio del backend necesario</h1>
        <p>
          La instalación ya está registrada en el servidor, pero este proceso de la
          API se inició <strong>antes</strong> de completar el asistente. Los módulos
          de login y base de datos solo se cargan al <strong>arranque</strong> de Nest.
        </p>
        <ol className="muted" style={{ textAlign: 'left', maxWidth: 520 }}>
          <li>En la terminal del backend, pulsa Ctrl+C para detenerlo.</li>
          <li>
            Vuelve a ejecutar <code>npm run start:dev</code> en la carpeta{' '}
            <code>backend</code>.
          </li>
          <li>Pulsa el botón de abajo (o recarga la página).</li>
        </ol>
        <p className="muted">
          Si ya reiniciaste el backend y sigues aquí, comprueba que el puerto del
          proxy (Vite → API) coincide con el <code>PORT</code> de <code>backend/.env</code>.
          También puedes recargar con Ctrl+F5.
        </p>
        <p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void retryAfterRestart()}
          >
            Ya reinicié el backend — comprobar de nuevo
          </button>
        </p>
      </div>
    );
  }

  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
