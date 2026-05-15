import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gestionAbsoluteUrl, routes } from '../../config/member-management';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { memberPortalRoutes } from '../../config/member-portal';

type Branding = {
  name: string;
  gym_logo: string | null;
  left_header: string;
};

type CheckResult = {
  valid: boolean;
  status: string;
  message: string;
  member_numeric_id: number | null;
  member_code: string | null;
  di_dni_type: string | null;
  di_dni_number: string | null;
  first_name: string | null;
  last_name: string | null;
  image: string | null;
  cycle_type: string;
  days_remaining: number | null;
  days_overdue: number | null;
  due_date: string | null;
  recorded: boolean;
};

/**
 * Pantalla de recepción sin menú lateral (ruta dedicada, suele abrirse en otra pestaña).
 */
export function AccessControlKioskPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const uploadBase = import.meta.env.VITE_UPLOAD_BASE as string | undefined;

  const [lookup, setLookup] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [brandLogoBroken, setBrandLogoBroken] = useState(false);

  const brandLogoSrc = useMemo(() => {
    const raw = branding?.gym_logo;
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (uploadBase) return `${uploadBase.replace(/\/$/, '')}/${raw}`;
    return raw;
  }, [branding?.gym_logo, uploadBase]);

  const brandTitle =
    branding?.left_header ?? branding?.name ?? 'Club360';

  const memberPhotoSrc = useMemo(() => {
    const raw = result?.image;
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (uploadBase) return `${uploadBase.replace(/\/$/, '')}/${raw}`;
    return raw;
  }, [result?.image, uploadBase]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const r = user.role_name?.trim().toLowerCase() ?? '';
    if (r === 'member') {
      navigate(memberPortalRoutes.wellness, { replace: true });
      return;
    }
    if (r !== 'administrator' && r !== 'staff_member') {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    api
      .get<Branding>('/settings/branding')
      .then(({ data }) => setBranding(data))
      .catch(() =>
        setBranding({
          name: 'Club360',
          gym_logo: null,
          left_header: 'Club360',
        }),
      );
  }, []);

  useEffect(() => {
    setBrandLogoBroken(false);
  }, [brandLogoSrc]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = lookup.trim();
    if (!q || busy) return;
    setBusy(true);
    try {
      const { data } = await api.post<CheckResult>('/access-control/check', {
        lookup: q,
        record: true,
      });
      setResult(data);
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { message?: string } } };
      if (ax.response?.status === 403) {
        setResult({
          valid: false,
          status: 'SIN_PERMISO',
          message:
            ax.response?.data?.message ??
            'No tienes permiso para registrar acceso de este socio.',
          member_numeric_id: null,
          member_code: null,
          di_dni_type: null,
          di_dni_number: null,
          first_name: null,
          last_name: null,
          image: null,
          cycle_type: '',
          days_remaining: null,
          days_overdue: null,
          due_date: null,
          recorded: false,
        });
      } else {
        setResult({
          valid: false,
          status: 'ERROR',
          message:
            'No se pudo completar la consulta. Revisa la conexión o vuelve a intentar.',
          member_numeric_id: null,
          member_code: null,
          di_dni_type: null,
          di_dni_number: null,
          first_name: null,
          last_name: null,
          image: null,
          cycle_type: '',
          days_remaining: null,
          days_overdue: null,
          due_date: null,
          recorded: false,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="reception-kiosk reception-kiosk--loading">
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="reception-kiosk">
      <header className="reception-kiosk-bar reception-kiosk-bar--logo-only">
        <div className="reception-kiosk-brand">
          {brandLogoSrc && !brandLogoBroken ? (
            <img
              src={brandLogoSrc}
              alt=""
              onError={() => setBrandLogoBroken(true)}
            />
          ) : (
            <span className="mm-sidebar-brand-fallback" aria-hidden>
              {brandTitle.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      </header>

      <main className="reception-kiosk-main mm-module-page">
        <div className="mm-module-centered">
          <h1 className="reception-kiosk-title">Control de acceso</h1>

          <section className="members-panel members-panel--pad">
            <form onSubmit={onSubmit} className="access-control-lookup-form">
              <label className="access-control-lookup-label muted" htmlFor="ac-kiosk-lookup">
                Identificador del socio
              </label>
              <input
                id="ac-kiosk-lookup"
                type="text"
                className="member-picker-input access-control-lookup-input"
                placeholder="ID, código de socio o DNI"
                value={lookup}
                onChange={(ev) => setLookup(ev.target.value)}
                autoComplete="off"
                autoFocus
                disabled={busy}
              />
              <button
                type="submit"
                className="btn-primary access-control-lookup-submit"
                disabled={busy || !lookup.trim()}
              >
                {busy ? 'Comprobando…' : 'Validar y registrar'}
              </button>
            </form>
          </section>

          {result ? (
            <section
              className="members-panel members-panel--pad access-control-result"
              style={{
                borderTop: `3px solid ${result.valid ? 'var(--mm-ok, #2e7d32)' : 'var(--mm-warn, #c62828)'}`,
              }}
            >
              <div className="access-control-result-inner">
                {memberPhotoSrc ? (
                  <img
                    src={memberPhotoSrc}
                    alt=""
                    width={72}
                    height={72}
                    className="access-control-result-photo"
                  />
                ) : null}
                <p className="access-control-result-name">
                  {result.first_name || result.last_name
                    ? [result.first_name, result.last_name].filter(Boolean).join(' ')
                    : '—'}
                </p>
                <p className="muted access-control-result-meta">
                  Estado: <strong>{result.status}</strong>
                  {result.member_numeric_id != null ? (
                    <>
                      {' · '}
                      <a
                        href={gestionAbsoluteUrl(
                          routes.sociosDetail(result.member_numeric_id),
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ficha #{result.member_numeric_id}
                      </a>
                    </>
                  ) : null}
                </p>
                <p className="access-control-result-message">{result.message}</p>
                {result.due_date ? (
                  <p className="muted access-control-result-meta">
                    Vencimiento considerado: {result.due_date}
                    {result.days_remaining != null
                      ? ` · Restan ${result.days_remaining} día(s)`
                      : ''}
                    {result.days_overdue != null
                      ? ` · Atraso ${result.days_overdue} día(s)`
                      : ''}
                    {result.cycle_type ? ` · Ciclo: ${result.cycle_type}` : ''}
                  </p>
                ) : null}
                <p className="muted access-control-result-note">
                  {result.recorded
                    ? 'Intento guardado en el registro de acceso.'
                    : 'No se ha guardado registro (p. ej. error al insertar).'}
                </p>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
