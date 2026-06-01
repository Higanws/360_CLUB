import { useEffect, useState, type FormEvent } from 'react';
import { api, apiUrl } from '../lib/api';
import { waitForApiBoot } from '../lib/api-boot-probe';
import { extractApiMessage } from '../lib/extract-api-message';
import { ThemeToggle } from '../components/ThemeToggle';

type Step = 0 | 1 | 2 | 3 | 4;

/** Host MySQL como `hostname` o `hostname:puerto` (puerto por defecto 3306). */
function parseMysqlHostPort(raw: string): { host: string; port: number } {
  const t = raw.trim();
  if (!t) return { host: 'localhost', port: 3306 };
  const idx = t.lastIndexOf(':');
  if (idx > 0) {
    const maybePort = t.slice(idx + 1);
    if (/^\d+$/.test(maybePort)) {
      const portNum = parseInt(maybePort, 10);
      if (portNum >= 1 && portNum <= 65535) {
        const hostPart = t.slice(0, idx);
        return { host: hostPart || 'localhost', port: portNum };
      }
    }
  }
  return { host: t, port: 3306 };
}

const INSTALL_STEP_LABEL: Record<string, string> = {
  validate: 'Validación de BD',
  connect: 'Conexión MySQL',
  drop_tables: 'Vaciar tablas',
  schema: 'Esquema SQL',
  seed: 'Datos demo',
  reconnect: 'Reconexión',
  truncate_seed: 'Seed y truncado MVP',
  admin: 'Usuario administrador',
  verify: 'Verificación',
  env: 'Archivo .env',
};

type InstallProgressLine = { step: string; message: string };

function installStepTitle(step: string): string {
  return INSTALL_STEP_LABEL[step] ?? step;
}

/**
 * Lee el stream SSE de `POST /install/run-stream` y devuelve el payload final `done`.
 */
async function consumeInstallRunStream(
  body: Record<string, unknown>,
  onProgress: (line: InstallProgressLine) => void,
): Promise<{ message: string; adminUsername: string }> {
  const res = await fetch(apiUrl('/install/run-stream'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  });

  if (!res.ok) {
    const text = await res.text();
    let detail = res.statusText;
    if (text) {
      try {
        const j = JSON.parse(text) as { message?: unknown };
        if (j?.message != null) {
          detail =
            typeof j.message === 'string'
              ? j.message
              : Array.isArray(j.message)
                ? j.message.join(', ')
                : JSON.stringify(j.message);
        } else {
          detail = text.slice(0, 800);
        }
      } catch {
        detail = text.slice(0, 800);
      }
    }
    throw new Error(detail);
  }

  if (!res.body) {
    throw new Error('El navegador no pudo leer la respuesta en streaming.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let doneResult: { message: string; adminUsername: string } | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, sep).trimEnd();
      buffer = buffer.slice(sep + 2);

      const dataLines = rawEvent
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.replace(/^data:\s?/, ''));
      const joined = dataLines.join('\n');
      if (!joined) continue;

      let data: Record<string, unknown>;
      try {
        data = JSON.parse(joined) as Record<string, unknown>;
      } catch {
        continue;
      }

      const step = String(data.step ?? '');
      if (step === 'error') {
        const msg =
          typeof data.message === 'string'
            ? data.message
            : 'Error en la instalación.';
        throw new Error(msg);
      }
      if (step === 'done') {
        const message =
          typeof data.message === 'string' ? data.message : '';
        const adminUsername =
          typeof data.adminUsername === 'string' ? data.adminUsername : '';
        doneResult = { message, adminUsername };
        continue;
      }
      if (typeof data.message === 'string') {
        onProgress({ step, message: data.message });
      }
    }
  }

  if (!doneResult) {
    throw new Error(
      'La conexión con el servidor terminó sin confirmar el fin de la instalación.',
    );
  }
  return doneResult;
}

export function InstallWizard() {
  const [step, setStep] = useState<Step>(0);
  const [dbHost, setDbHost] = useState('localhost');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin');
  const [testing, setTesting] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [dockerAutoRestart, setDockerAutoRestart] = useState(false);
  const [waitingForRestart, setWaitingForRestart] = useState(false);
  const [dbCheckSummary, setDbCheckSummary] = useState<string | null>(null);
  const [installProgressLines, setInstallProgressLines] = useState<
    InstallProgressLine[]
  >([]);

  const resolvedMysql = parseMysqlHostPort(dbHost);

  useEffect(() => {
    if (step !== 4 || !dockerAutoRestart) {
      return;
    }
    let alive = true;
    setWaitingForRestart(true);
    void (async () => {
      const ok = await waitForApiBoot();
      if (!alive) return;
      setWaitingForRestart(false);
      if (ok) {
        window.location.reload();
      }
    })();
    return () => {
      alive = false;
    };
  }, [step, dockerAutoRestart]);

  async function testDb() {
    setError(null);
    setErrorHint(null);
    if (!database.trim()) {
      setError('Indica el nombre de la base de datos.');
      return;
    }
    const { host, port } = parseMysqlHostPort(dbHost);
    setTesting(true);
    setDbCheckSummary(null);
    try {
      const { data } = await api.post<{
        ok: boolean;
        error?: string;
        hint?: string;
        currentDatabase?: string;
        mysqlUser?: string;
        appliedCredentialsSummary?: string;
        matchesExpectedDatabase?: boolean;
      }>('/install/test-db', {
        host,
        port,
        username: username.trim(),
        password,
        database: database.trim(),
      });
      if (data.ok) {
        if (data.matchesExpectedDatabase === false) {
          setError(
            `MySQL acepta la conexión pero la base activa («${data.currentDatabase ?? '?'}») no es «${database.trim()}». Revisa el nombre de la base.`,
          );
          setErrorHint(null);
          return;
        }
        const bits = [
          data.appliedCredentialsSummary
            ? `Conexión verificada: ${data.appliedCredentialsSummary}`
            : null,
          data.currentDatabase
            ? `DATABASE() = «${data.currentDatabase}» (misma que se escribirá en backend/.env).`
            : null,
          data.mysqlUser ? `Sesión MySQL: ${data.mysqlUser}.` : null,
        ].filter(Boolean);
        setDbCheckSummary(bits.join(' '));
        setStep(2);
      } else {
        setError(data.error ?? 'Conexión rechazada.');
        setErrorHint(data.hint ?? null);
      }
    } catch (err: unknown) {
      setError(extractApiMessage(err) || 'Error comprobando la base de datos.');
    } finally {
      setTesting(false);
    }
  }

  async function runInstall(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorHint(null);
    setInstallProgressLines([]);
    setInstalling(true);
    const { host, port } = parseMysqlHostPort(dbHost);
    try {
      const testRes = await api.post<{
        ok: boolean;
        error?: string;
        hint?: string;
        matchesExpectedDatabase?: boolean;
        currentDatabase?: string;
      }>('/install/test-db', {
        host,
        port,
        username: username.trim(),
        password,
        database: database.trim(),
      });
      if (!testRes.data.ok) {
        setError(
          testRes.data.error ??
            'No se pudo conectar a la base de datos. Revisa host, usuario y contraseña.',
        );
        setErrorHint(testRes.data.hint ?? null);
        return;
      }
      if (testRes.data.matchesExpectedDatabase === false) {
        setError(
          `La base activa en MySQL («${testRes.data.currentDatabase ?? '?'}») no coincide con «${database.trim()}». No se instalará hasta corregirlo.`,
        );
        setErrorHint(null);
        return;
      }

      const streamResult = await consumeInstallRunStream(
        {
          host,
          port,
          username: username.trim(),
          password,
          database: database.trim(),
          adminUsername: adminUsername.trim(),
          adminPassword,
        },
        (line) => {
          setInstallProgressLines((prev) => [...prev, line]);
        },
      );

      const statusRes = await api.get<{
        installed: boolean;
        dockerAutoRestart?: boolean;
      }>('/install/status');
      if (!statusRes.data?.installed) {
        setError(
          'Las tablas pueden haberse creado, pero no se registró la instalación en el servidor (backend/data). No continúes hasta revisar permisos o los logs del backend.',
        );
        return;
      }

      setDockerAutoRestart(!!statusRes.data.dockerAutoRestart);
      setDoneMsg(streamResult.message);
      setStep(4);
    } catch (err: unknown) {
      const m =
        err instanceof Error
          ? err.message
          : extractApiMessage(err) || 'La instalación falló.';
      setError(m);
    } finally {
      setInstalling(false);
    }
  }

  return (
    <div className="wizard-root">
      <div className="wizard-bg" aria-hidden />
      <header className="wizard-top">
        <span className="wizard-brand">Club360 · Instalación</span>
        <ThemeToggle />
      </header>

      <main className="wizard-main">
        <div className="wizard-card">
          <div className="wizard-steps" aria-hidden>
            {['Inicio', 'BD', 'Admin', 'Confirmar', 'Fin'].map((label, i) => (
              <span
                key={label}
                className={
                  i <= step ? 'wizard-step active' : 'wizard-step'
                }
              >
                {label}
              </span>
            ))}
          </div>

          {step === 0 && (
            <section className="wizard-section">
              <h1>Bienvenido</h1>
              <p className="muted">
                Con una conexión válida se crearán solo las tablas del MVP (gestión
                de socios y personal del club) y los datos iniciales mínimos:
                ajustes del club, planes de membresía de ejemplo y cuentas demo.
              </p>
              <p className="muted">
                Define después el usuario y la contraseña del administrador.
                Antes de continuar, crea en MySQL una base de datos vacía con el
                nombre que indicarás. En el paso de conexión puedes usar host con
                puerto en un solo campo (por ejemplo{' '}
                <code>127.0.0.1:3307</code>) si no usas el puerto por defecto.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setStep(1)}
              >
                Siguiente
              </button>
            </section>
          )}

          {step === 1 && (
            <section className="wizard-section">
              <h1>Configuración de la base de datos</h1>
              <p className="muted">
                Orden habitual: nombre de la base, usuario, contraseña y host (el
                host puede llevar el puerto como <code>servidor:3306</code>).
              </p>
              <p className="muted">
                <strong>Importante:</strong> las credenciales y la base que indiques aquí
                son exactamente las que el servidor comprobará con{' '}
                <code>SELECT 1</code> y <code>DATABASE()</code> y las que se guardarán en{' '}
                <code>backend/.env</code> al finalizar la instalación (misma conexión que
                usará Nest y TypeORM).
              </p>
              <div className="wizard-grid">
                <label className="wizard-span2">
                  Nombre de la base de datos
                  <input
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    placeholder="club360"
                    autoComplete="off"
                  />
                </label>
                <label>
                  Usuario de la base de datos
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="root"
                    autoComplete="off"
                  />
                </label>
                <label>
                  Contraseña de la base de datos
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="off"
                  />
                </label>
                <label className="wizard-span2">
                  Host
                  <input
                    value={dbHost}
                    onChange={(e) => setDbHost(e.target.value)}
                    placeholder="localhost o 127.0.0.1:3307"
                    autoComplete="off"
                  />
                </label>
              </div>
              {error ? <p className="login-error">{error}</p> : null}
              {errorHint ? <p className="muted">{errorHint}</p> : null}
              <div className="wizard-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setStep(0)}
                >
                  Atrás
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={testing}
                  onClick={() => void testDb()}
                >
                  {testing ? 'Probando…' : 'Probar conexión'}
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="wizard-section">
              <h1>Conexión correcta</h1>
              {dbCheckSummary ? (
                <p className="muted" role="status">
                  {dbCheckSummary}
                </p>
              ) : null}
              <p className="muted">
                Se pudo conectar. Define la cuenta de administrador (por
                defecto <strong>admin</strong> / <strong>admin</strong>).
              </p>
              <div className="wizard-grid">
                <label>
                  Usuario admin
                  <input
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                  />
                </label>
                <label>
                  Contraseña admin
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </label>
              </div>
              <div className="wizard-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setStep(1)}
                >
                  Atrás
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setStep(3)}
                >
                  Crear tablas y usuario
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="wizard-section">
              <h1>Confirmar</h1>
              <p className="muted">
                Se <strong>eliminarán todas las tablas</strong> de esta base (incluido el historial de
                Prisma). Luego aplica el esquema SQL en{' '}
                <code>backend/database/schema/schema_mysql.sql</code> y los datos demo en{' '}
                <code>backend/database/seed/seed_mvp.sql</code>.
                Después se vacían las tablas MVP, se importa el <strong>seed SQL</strong> de demo y se
                fija el administrador.
              </p>
              <p className="muted">
                Si la base ya tenía datos o un esquema antiguo, <strong>se perderá todo</strong> al confirmar.
              </p>
              <ul className="wizard-summary muted">
                <li>
                  BD: {username}@{resolvedMysql.host}:{resolvedMysql.port}/{database}
                </li>
                <li>
                  Admin: {adminUsername} (
                  {adminPassword ? '•'.repeat(Math.min(adminPassword.length, 12)) : '—'}
                  )
                </li>
              </ul>
              {error ? <p className="login-error">{error}</p> : null}
              {errorHint ? <p className="muted">{errorHint}</p> : null}
              {installing && installProgressLines.length > 0 ? (
                <div
                  className="wizard-install-progress"
                  role="status"
                  aria-live="polite"
                  aria-atomic="false"
                >
                  <p className="wizard-install-progress-title">
                    Avance de la instalación
                  </p>
                  <ol className="wizard-install-log">
                    {installProgressLines.map((line, i) => (
                      <li
                        key={`${line.step}-${i}`}
                        className={
                          i === installProgressLines.length - 1
                            ? 'is-current'
                            : undefined
                        }
                      >
                        <span className="wizard-install-step-label">
                          {installStepTitle(line.step)}
                        </span>
                        <span className="wizard-install-step-msg">
                          {line.message}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
              <form onSubmit={(e) => void runInstall(e)}>
                <div className="wizard-actions">
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => setStep(2)}
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={installing}
                  >
                    {installing ? 'Instalando…' : 'Instalar ahora'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {step === 4 && doneMsg && (
            <section className="wizard-section">
              <h1>Listo</h1>
              <p className="muted">{doneMsg}</p>
              {dockerAutoRestart ? (
                <>
                  <p className="muted">
                    {waitingForRestart
                      ? 'Esperando a que la API reinicie y cargue login y base de datos…'
                      : 'Si la app no continúa sola, recargá la página o ejecutá en la terminal: docker compose restart api'}
                  </p>
                  {waitingForRestart ? (
                    <p className="muted">No hace falta detener contenedores a mano.</p>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => window.location.reload()}
                    >
                      Recargar la app
                    </button>
                  )}
                </>
              ) : (
                <>
                  <ol className="wizard-restart muted">
                    <li>
                      <strong>Obligatorio:</strong> detén el proceso del backend (Ctrl+C
                      en la terminal donde corre Nest).
                    </li>
                    <li>
                      Vuelve a ejecutar <code>npm run start:dev</code> en la carpeta{' '}
                      <code>backend</code> para cargar el <code>.env</code> y activar login
                      y base de datos. Sin este paso verás «Cannot POST /api/auth/login».
                    </li>
                    <li>
                      Solo entonces pulsa «Continuar» (recarga la app y comprueba que la API
                      está lista).
                    </li>
                  </ol>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => window.location.reload()}
                  >
                    Continuar (ya reinicié el backend)
                  </button>
                </>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
