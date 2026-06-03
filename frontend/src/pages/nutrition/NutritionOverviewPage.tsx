import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MmSelect } from '../../components/ui/MmSelect';
import { routes } from '../../config/member-management';
import { memberPortalRoutes } from '../../config/member-portal';
import { MmTableActions } from '../../components/mm/MmTableActions';
import {
  DEFAULT_PAGE_SIZE,
  pageRangeLabel,
} from '../../lib/pagination';
import { useNutritionOverview } from '../../lib/queries/lists';
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [error, setError] = useState<string | null>(null);

  const enabled = !!user;
  const { data, isFetching, isError } = useNutritionOverview(
    page,
    pageSize,
    enabled,
  );

  const rows = (data?.rows ?? []) as OverviewRow[];
  const meta = data?.meta ?? null;

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const r = user.role_name?.trim().toLowerCase() ?? '';
    if (r === 'member') navigate(memberPortalRoutes.wellness, { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (isError) setError('No se pudo cargar el listado de nutrición.');
    else setError(null);
  }, [isError]);

  const showPager = meta && meta.pageCount > 1;

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

      {meta ? (
        <p className="muted small" style={{ margin: '0 0 0.75rem' }}>
          {pageRangeLabel(meta)}
        </p>
      ) : null}

      {showPager ? (
        <div className="members-toolbar members-pagination-toolbar">
          <div className="members-pagination">
            <button
              type="button"
              className="btn-outline"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </button>
            <span className="muted small members-pagination-status">
              Página {meta!.page} de {meta!.pageCount}
            </span>
            <button
              type="button"
              className="btn-outline"
              disabled={page >= meta!.pageCount || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
          <label className="members-page-size">
            <span className="muted small">Por página</span>
            <MmSelect
              value={String(pageSize)}
              disabled={isFetching}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
              options={[
                { value: '25', label: '25' },
                { value: '50', label: '50' },
                { value: '100', label: '100' },
              ]}
            />
          </label>
        </div>
      ) : null}

      <section className="members-panel mm-data-panel">
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
                    <MmTableActions label={`Dieta de ${name || row.member_id}`}>
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
                    </MmTableActions>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && !error ? (
          <p className="muted members-empty">
            {isFetching ? 'Cargando…' : 'No hay socios en el sistema.'}
          </p>
        ) : null}
      </section>
    </div>
  );
}
