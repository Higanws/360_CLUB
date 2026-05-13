import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../../config/member-management';
import { memberPortalRoutes } from '../../config/member-portal';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

type OverviewRow = {
  member_id: number;
  first_name: string | null;
  last_name: string | null;
  plan_id: number | null;
  valid_from: string | null;
  valid_to: string | null;
  meal_count: number;
};

export function NutritionOverviewPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<OverviewRow[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    api
      .get<{ rows: OverviewRow[] }>('/nutrition/overview')
      .then(({ data }) => setRows(data.rows))
      .catch(() => setError('No se pudo cargar el listado de nutrición.'));
  }, [user, navigate]);

  if (loading || !user) {
    return (
      <div className="mm-page">
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <h1>Nutrición</h1>
          <p className="muted">
            Cada plan es exclusivo de un socio. La semana tipo se guarda como
            franjas día + hora + texto (comida, ingredientes, preparación) en un
            solo JSON por plan.
          </p>
        </div>
        <div className="members-toolbar">
          <Link to={routes.nutricionNuevo} className="btn-primary">
            + Crear dieta
          </Link>
        </div>
      </header>

      {error ? <p className="login-error">{error}</p> : null}

      <section className="members-panel">
        <div className="members-table-wrap">
          <table className="members-table">
            <thead>
              <tr>
                <th>Socio</th>
                <th>Plan</th>
                <th>Vigencia</th>
                <th>Comidas registradas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const name = [row.first_name, row.last_name]
                  .filter(Boolean)
                  .join(' ')
                  .trim();
                const vig =
                  row.valid_from || row.valid_to
                    ? `${row.valid_from ?? '—'} → ${row.valid_to ?? '—'}`
                    : '—';
                return (
                  <tr key={row.member_id}>
                    <td>{name || `#${row.member_id}`}</td>
                    <td>
                      {row.plan_id ? (
                        <span className="member-status member-status--ok">
                          Activo
                        </span>
                      ) : (
                        <span className="muted">Sin plan</span>
                      )}
                    </td>
                    <td>{vig}</td>
                    <td>{row.meal_count}</td>
                    <td className="members-actions">
                      <Link
                        to={
                          row.plan_id
                            ? routes.nutricionMember(row.member_id)
                            : `${routes.nutricionNuevo}?socio=${row.member_id}`
                        }
                        className="btn-table btn-table--link"
                      >
                        {row.plan_id ? 'Editar dieta' : 'Crear dieta'}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && !error ? (
          <p className="muted members-empty">No hay socios en el sistema.</p>
        ) : null}
      </section>
    </div>
  );
}
