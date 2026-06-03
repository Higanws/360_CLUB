import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MmSelect } from '../../components/ui/MmSelect';
import { routes } from '../../config/member-management';
import { memberPortalRoutes } from '../../config/member-portal';
import { api } from '../../lib/api';
import { activityDifficultyLabel } from '../../lib/activity-difficulty';
import { MmTableActions } from '../../components/mm/MmTableActions';
import {
  DEFAULT_PAGE_SIZE,
  pageRangeLabel,
} from '../../lib/pagination';
import { useActivitiesList } from '../../lib/queries/lists';
import { useAuth } from '../../context/AuthContext';

type Row = {
  id: number;
  title: string;
  category_id: number;
  category_name: string;
  description: string | null;
  difficulty_level: string;
  trainer_names: string[];
  video_count: number;
};

export function ActivitiesListPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const { data, isLoading, isError } = useActivitiesList(page, pageSize);
  const rows = (data?.activities ?? []) as Row[];
  const meta = data?.meta;

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const r = user.role_name?.trim().toLowerCase() ?? '';
    if (r === 'member') navigate(memberPortalRoutes.wellness, { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (isError) setError('No se pudo cargar la lista de ejercicios.');
    else setError(null);
  }, [isError]);

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este ejercicio?')) return;
    try {
      await api.delete(`/activities/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['activities', 'list'] });
      setError(null);
    } catch {
      setError('No se pudo eliminar el ejercicio.');
    }
  }

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
          <h1>Ejercicios</h1>
          <p className="muted">
            <span className="members-breadcrumb">Actividades / ejercicios</span>
          </p>
        </div>
        <Link to={routes.ejerciciosNuevo} className="btn-primary">
          + Nuevo ejercicio
        </Link>
      </header>

      {error ? <p className="login-error">{error}</p> : null}
      {meta ? (
        <p className="muted small">{pageRangeLabel(meta)}</p>
      ) : null}

      {showPager ? (
        <div className="members-toolbar members-pagination-toolbar">
          <div className="members-pagination">
            <button
              type="button"
              className="btn-outline"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </button>
            <span className="muted small">
              Página {meta!.page} de {meta!.pageCount}
            </span>
            <button
              type="button"
              className="btn-outline"
              disabled={page >= meta!.pageCount || isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
          <label className="members-page-size">
            <span className="muted small">Por página</span>
            <MmSelect
              value={String(pageSize)}
              disabled={isLoading}
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
                <th>Título</th>
                <th>Categoría</th>
                <th>Dificultad</th>
                <th>Entrenadores</th>
                <th>Videos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="pay-table-empty">
                    {isLoading ? 'Cargando…' : 'No hay ejercicios.'}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.category_name}</td>
                    <td>{activityDifficultyLabel(row.difficulty_level)}</td>
                    <td>{row.trainer_names.join(', ') || '—'}</td>
                    <td>{row.video_count}</td>
                    <MmTableActions label={`Ejercicio ${row.title}`}>
                      <Link
                        to={routes.ejerciciosDetail(row.id)}
                        className="btn-table btn-table--link"
                      >
                        Ver
                      </Link>
                      <Link
                        to={routes.ejerciciosEdit(row.id)}
                        className="btn-table btn-table--link"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        className="btn-table btn-table--danger"
                        onClick={() => void handleDelete(row.id)}
                      >
                        Borrar
                      </button>
                    </MmTableActions>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
