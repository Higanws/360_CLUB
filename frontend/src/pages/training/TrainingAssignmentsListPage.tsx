import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { MmSearchField } from '../../components/ui/MmSearchField';
import { MmSelect } from '../../components/ui/MmSelect';
import { routes } from '../../config/member-management';
import { memberPortalRoutes } from '../../config/member-portal';
import { api } from '../../lib/api';
import { MmTableActions } from '../../components/mm/MmTableActions';
import {
  DEFAULT_PAGE_SIZE,
  pageRangeLabel,
} from '../../lib/pagination';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useTrainingAssignmentsList } from '../../lib/queries/lists';
import { useAuth } from '../../context/AuthContext';

type Row = {
  id: number;
  routine_id: number;
  routine_title: string;
  member_ids: number[];
  member_names: string[];
  trainer_names: string[];
  created_at: string;
};

function formatNames(names: string[]): string {
  if (!names.length) return '—';
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}

export function TrainingAssignmentsListPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const debouncedQuery = useDebouncedValue(filterQuery, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const enabled = !!user;
  const { data, isFetching, isError, error: queryError } =
    useTrainingAssignmentsList(page, pageSize, debouncedQuery, enabled);

  const rows = (data?.assignments ?? []).map((r) => ({
    ...(r as Row),
    member_ids: Array.isArray((r as Row).member_ids)
      ? (r as Row).member_ids
      : [],
  }));
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
    if (isError) {
      if (axios.isAxiosError(queryError) && queryError.response?.status === 403) {
        navigate(memberPortalRoutes.wellness, { replace: true });
        return;
      }
      setError('No se pudo cargar las asignaciones.');
    } else {
      setError(null);
    }
  }, [isError, queryError, navigate]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta asignación?')) return;
    try {
      await api.delete(`/training-assignments/${id}`);
      await queryClient.invalidateQueries({
        queryKey: ['training-assignments', 'list'],
      });
      setError(null);
    } catch {
      setError('No se pudo eliminar la asignación.');
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
          <h1>Asignar entrenamiento</h1>
          <p className="muted">
            <span className="members-breadcrumb">
              Vincula una rutina con uno o más socios y entrenadores
            </span>
          </p>
        </div>
      </header>

      <div className="members-toolbar">
        <Link to={routes.rutinasAsignacionesNuevo} className="btn-primary">
          + Nueva asignación
        </Link>
        <Link to={routes.rutinas} className="btn-outline">
          Rutinas (crear / editar)
        </Link>
      </div>

      {error ? <p className="login-error">{error}</p> : null}

      <div className="pay-toolbar">
        <MmSearchField
          grow
          label="Filtrar por socio o entrenador"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Socio, ID de socio, entrenador o título de rutina…"
          autoComplete="off"
        />
      </div>

      {meta ? (
        <p className="muted small pay-footer-note">{pageRangeLabel(meta)}</p>
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
                <th>Rutina</th>
                <th>Socios</th>
                <th>Entrenadores</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="pay-table-empty">
                    {isFetching
                      ? 'Cargando…'
                      : 'No hay asignaciones. Crea rutinas en «Crear entrenamiento» y luego vincúlalas aquí.'}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.routine_title}</td>
                    <td>{formatNames(row.member_names)}</td>
                    <td>{formatNames(row.trainer_names)}</td>
                    <MmTableActions label={`Asignación ${row.routine_title}`}>
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
