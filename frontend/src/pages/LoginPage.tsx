import axios from 'axios';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function extractApiMessage(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'data' in err.response &&
    err.response.data &&
    typeof err.response.data === 'object'
  ) {
    const data = err.response.data as {
      message?: unknown;
      error?: unknown;
      statusCode?: number;
    };
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }
    const m = data.message;
    if (Array.isArray(m)) return m.map(String).join(', ');
    if (typeof m === 'string') return m;
    if (m != null && typeof m === 'object') {
      return JSON.stringify(m);
    }
  }
  return '';
}

type Branding = {
  name: string;
  gym_logo: string | null;
  left_header: string;
  footer: string;
  header_color: string;
};

export function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [branding, setBranding] = useState<Branding | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<Branding>('/settings/branding')
      .then(({ data }) => setBranding(data))
      .catch(() =>
        setBranding({
          name: 'Club360',
          gym_logo: null,
          left_header: 'Club360',
          footer: '',
          header_color: '#27272a',
        }),
      );
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/home', { replace: true });
    }
  }, [authLoading, user, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(username.trim(), password);
      navigate('/home', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError(
          'El servidor no expone aún el login (suele ocurrir justo después del asistente: detén el backend, ejecuta de nuevo npm run start:dev en la carpeta backend y recarga esta página).',
        );
        return;
      }
      const msg = extractApiMessage(err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const statusText = axios.isAxiosError(err)
        ? err.response?.statusText
        : undefined;
      if (msg) {
        setError(msg);
        return;
      }
      if (status === 500 && statusText) {
        setError(`Error del servidor (${status} ${statusText}). Revisa la consola del backend Nest.`);
        return;
      }
      setError('No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  }

  const title = branding?.left_header ?? branding?.name ?? 'Club360';

  return (
    <div className="login-root">
      <div className="login-bg" aria-hidden />
      <div className="login-stack">
        <div className="login-bar">
          <ThemeToggle />
        </div>

        <header className="login-header">
          <h1>{title}</h1>
        </header>

        <section className="login-card">
          <div className="login-logo">
            {branding?.gym_logo ? (
              <img
                src={branding.gym_logo}
                alt=""
                onError={(ev) => {
                  (ev.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="login-logo-fallback" aria-hidden>
                ◆
              </span>
            )}
          </div>

          <form className="login-form" onSubmit={onSubmit}>
            <input
              name="username"
              autoComplete="username"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error ? <div className="login-error">{error}</div> : null}
            <button type="submit" disabled={busy}>
              {busy ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="login-links">
            <Link to="#">¿Olvidaste la contraseña?</Link>
          </p>

          {branding?.footer ? (
            <footer className="login-footer">{branding.footer}</footer>
          ) : null}
        </section>
      </div>
    </div>
  );
}
