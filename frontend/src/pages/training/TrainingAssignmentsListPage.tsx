import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../../config/member-management';
import { memberPortalRoutes } from '../../config/member-portal';
import { api } from '../../lib/api';
import { MmTableActions } from '../../components/mm/MmTableActions';
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

const PAGE_SIZE = 10;

function formatNames(names: string[]): string {
  if (!names.length) return '—';
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}

export function TrainingAssignmentsListPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const r = user.role_name?.trim().toLowerCase() ?? '';
    if (r === 'member') {
      navigate(memberPortalRoutes.wellness, { replace: true });
      return;
    }
    api
      .get<Row[]>('/training-assignments')
      .then(({ data }) => {
        setRows(
          (data ?? []).map((r) => ({
            ...r,
            member_ids: Array.isArray(r.member_ids) ? r.member_ids : [],
          })),
        );
        setError(null);
      })
      .catch((e: unknown) => {
        if (axios.isAxiosError(e) && e.response?.status === 403) {
          navigate(memberPortalRoutes.wellness, { replace: true });
          return;
        }
        setError('No se pudo cargar las asignaciones.');
      });
  }, [user, navigate]);

  const filtered = useMemo(() => {
    const raw = filterQuery.trim();
    if (!raw) return rows;
    const q = raw.toLowerCase();
    return rows.filter((r) => {
      const memberNamesBlob = r.member_names.join(' ').toLowerCase();
      const trainerBlob = r.trainer_names.join(' ').toLowerCase();
      const routine = (r.routine_title ?? '').toLowerCase();
      const idMatch = r.member_ids.some((id) => String(id).includes(raw));
      return (
        memberNamesBlob.includes(q) ||
        idMatch ||
        trainerBlob.includes(q) ||
        routine.includes(q)
      );
    });
  }, [rows, filterQuery]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount - 1);
  const slice = filtered.slice(
    pageSafe * PAGE_SIZE,
    pageSafe * PAGE_SIZE + PAGE_SIZE,
  );

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta asignación?')) return;
    try {
      await api.delete(`/training-assignments/${id}`);
      const { data } = await api.get<Row[]>('/training-assignments');
      setRows(
        (data ?? []).map((r) => ({
          ...r,
          member_ids: Array.isArray(r.member_ids) ? r.member_ids : [],
        })),
      );
      setError(null);
    } catch {
      setError('No se pudo eliminar la asignación.');
    }
  }

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
        <label className="pay-search pay-search--grow">
          <span>Filtrar por socio o entrenador</span>
          <input
            type="search"
            value={filterQuery}
            onChange={(e) => {
              setFilterQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Socio, ID de socio, entrenador o título de rutina…"
            autoComplete="off"
          />
        </label>
      </div>

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
              {slice.length === 0 ? (
                <tr>
                  <td colSpan={4} className="pay-table-empty">
                    No hay asignaciones. Crea rutinas en «Crear entrenamiento» y
                    luego vincúlalas aquí.
                  </td>
                </tr>
              ) : (
                slice.map((row) => (
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

      {filtered.length > PAGE_SIZE ? (
        <footer className="pay-pagination">
          <button
            type="button"
            className="btn-outline"
            disabled={pageSafe <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Anterior
          </button>
          <span className="muted">
            Página {pageSafe + 1} de {pageCount} ({filtered.length} entradas)
          </span>
          <button
            type="button"
            className="btn-outline"
            disabled={pageSafe >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            Siguiente
          </button>
        </footer>
      ) : (
        <p className="muted pay-footer-note">
          {filtered.length === 0
            ? ''
            : `Mostrando ${filtered.length} entrada(s).`}
        </p>
      )}
    </div>
  );
}
