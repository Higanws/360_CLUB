import { useCallback, useEffect, useState } from 'react';
import { api } from './lib/api';
import { isApiFullyBooted, waitForApiBoot } from './lib/api-boot-probe';
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

export function RootApp() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [bootDetail, setBootDetail] = useState<string | null>(null);
  const [dockerAutoRestart, setDockerAutoRestart] = useState(false);

  const probeBackend = useCallback(async (): Promise<Phase> => {
    let installed = false;
    let gotStatus = false;
    for (let i = 0; i < STATUS_ATTEMPTS; i++) {
      if (i > 0) {
        setBootDetail(`Conectando con la API (${i + 1}/${STATUS_ATTEMPTS})…`);
      }
      try {
        const res = await api.get<{
          installed: boolean;
          dockerAutoRestart?: boolean;
        }>('/install/status');
        installed = !!res.data?.installed;
        setDockerAutoRestart(!!res.data?.dockerAutoRestart);
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

  useEffect(() => {
    if (phase !== 'needs-backend-restart' || !dockerAutoRestart) {
      return;
    }
    let alive = true;
    setBootDetail('Reiniciando la API…');
    void (async () => {
      const ok = await waitForApiBoot();
      if (!alive) return;
      if (ok) {
        setBootDetail(null);
        setPhase('ready');
      } else {
        setBootDetail(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [phase, dockerAutoRestart]);

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
        <h1 className="boot-screen-title">
          {dockerAutoRestart ? 'Reiniciando la API…' : 'Reinicio del backend necesario'}
        </h1>
        {dockerAutoRestart ? (
          <>
            <p>
              La instalación terminó. El contenedor de la API se está reiniciando para
              activar login y base de datos.
            </p>
            {bootDetail ? <p className="muted">{bootDetail}</p> : null}
          </>
        ) : (
          <>
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
              proxy (Vite → API) coincide con el <code>PORT</code> de{' '}
              <code>backend/.env</code>. También puedes recargar con Ctrl+F5.
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
          </>
        )}
      </div>
    );
  }

  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
