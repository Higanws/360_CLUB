import { useCallback, useEffect, useMemo, useState } from 'react';
import { bindDateRange } from '../../lib/date-range';
import { Link, useNavigate } from 'react-router-dom';
import { MmDatePicker } from '../../components/ui/MmDatePicker';
import { routes } from '../../config/member-management';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { memberPortalRoutes } from '../../config/member-portal';
import {
  type AccessLogRow,
  firstDayOfMonthYmd,
  localYmd,
  outcomeLabel,
} from './access-control.shared';

export function AccessControlLogPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [from, setFrom] = useState(firstDayOfMonthYmd);
  const [to, setTo] = useState(() => localYmd(new Date()));
  const [rows, setRows] = useState<AccessLogRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filterRange = useMemo(
    () => bindDateRange(from, to, setFrom, setTo),
    [from, to],
  );

  const load = useCallback(() => {
    setBusy(true);
    setError(null);
    const q = new URLSearchParams({
      limit: '500',
      from,
      to,
    });
    api
      .get<AccessLogRow[]>(`/access-control/recent?${q.toString()}`)
      .then(({ data }) => setRows(data))
      .catch(() => setError('No se pudo cargar el registro de accesos.'))
      .finally(() => setBusy(false));
  }, [from, to]);

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
    load();
    // Solo carga inicial; el rango se aplica con «Aplicar filtros».
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  if (loading || !user) {
    return (
      <div className="mm-page mm-module-page">
        <p className="muted mm-module-centered">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="mm-page mm-module-page">
      <div className="mm-module-centered mm-module-centered--wide">
        <header className="mm-page-head">
          <div>
            <h1>Registro de accesos</h1>
            <p className="muted">
              Historial del control de acceso. Filtra por rango de fechas (día de
              registro en el club).
            </p>
          </div>
          <div className="members-toolbar members-toolbar--center">
            <Link to={routes.gestion} className="btn-outline">
              ← Volver a gestión
            </Link>
          </div>
        </header>

        <section className="members-panel members-panel--pad mm-data-panel mm-module-centered">
          <form
            className="mm-data-panel__toolbar access-control-filters mm-filter-toolbar"
            onSubmit={(e) => {
              e.preventDefault();
              load();
            }}
          >
            <label>
              <span className="muted">Desde</span>
              <MmDatePicker
                value={filterRange.desde}
                onChange={filterRange.onDesdeChange}
                max={filterRange.maxDesde}
                disabled={busy}
                aria-label="Filtro desde"
              />
            </label>
            <label>
              <span className="muted">Hasta</span>
              <MmDatePicker
                value={filterRange.hasta}
                onChange={filterRange.onHastaChange}
                min={filterRange.minHasta}
                disabled={busy}
                aria-label="Filtro hasta"
              />
            </label>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Cargando…' : 'Aplicar filtros'}
            </button>
          </form>

          {error ? <p className="login-error">{error}</p> : null}

          <div className="mm-data-panel__body">
          <div className="members-table-wrap">
            <table className="members-table members-table--centered">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Día</th>
                  <th>Búsqueda</th>
                  <th>Socio</th>
                  <th>Resultado</th>
                  <th>Recepción</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr className="mm-table-empty">
                    <td colSpan={6}>No hay registros en este rango.</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>{new Date(row.access_at).toLocaleString('es-ES')}</td>
                      <td>{row.access_date}</td>
                      <td>{row.lookup_raw ?? '—'}</td>
                      <td>
                        {row.member_id != null ? (
                          <Link to={routes.sociosDetail(row.member_id)}>
                            {[row.first_name, row.last_name]
                              .filter(Boolean)
                              .join(' ') || `#${row.member_id}`}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{outcomeLabel(row.outcome)}</td>
                      <td>
                        {[row.staff_first_name, row.staff_last_name]
                          .filter(Boolean)
                          .join(' ') || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>
        </section>
      </div>
    </div>
  );
}
