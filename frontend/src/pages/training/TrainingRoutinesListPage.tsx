import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MmSearchField } from '../../components/ui/MmSearchField';
import { routes } from '../../config/member-management';
import { memberPortalRoutes } from '../../config/member-portal';
import { api } from '../../lib/api';
import { routineDifficultyLabel } from '../../lib/activity-difficulty';
import { MmTableActions } from '../../components/mm/MmTableActions';
import { useAuth } from '../../context/AuthContext';

type Row = {
  id: number;
  title: string;
  difficulty_level: string;
  exercise_count: number;
};

const PAGE_SIZE = 10;

export function TrainingRoutinesListPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
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
      .get<Row[]>('/training-routines')
      .then(({ data }) => {
        setRows(data);
        setError(null);
      })
      .catch((e: unknown) => {
        if (axios.isAxiosError(e) && e.response?.status === 403) {
          navigate(memberPortalRoutes.wellness, { replace: true });
          return;
        }
        setError('No se pudo cargar las rutinas.');
      });
  }, [user, navigate]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        routineDifficultyLabel(r.difficulty_level).toLowerCase().includes(q),
    );
  }, [rows, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount - 1);
  const slice = filtered.slice(
    pageSafe * PAGE_SIZE,
    pageSafe * PAGE_SIZE + PAGE_SIZE,
  );

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta rutina? Se borrarán también sus asignaciones.')) {
      return;
    }
    try {
      await api.delete(`/training-routines/${id}`);
      const { data } = await api.get<Row[]>('/training-routines');
      setRows(data);
      setError(null);
    } catch {
      setError('No se pudo eliminar la rutina.');
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
          <h1>Crear entrenamiento (rutina)</h1>
          <p className="muted">
            <span className="members-breadcrumb">
              Rutinas: varios ejercicios; nivel único o mixto
            </span>
          </p>
        </div>
      </header>

      <div className="members-toolbar">
        <Link to={routes.rutinasNuevo} className="btn-primary">
          + Nueva rutina
        </Link>
      </div>

      {error ? <p className="login-error">{error}</p> : null}

      <div className="pay-toolbar">
        <span className="muted">Mostrar entradas</span>
        <MmSearchField
          label="Buscar:"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Título o nivel"
        />
      </div>

      <section className="members-panel mm-data-panel">
        <div className="members-table-wrap">
          <table className="members-table">
            <thead>
              <tr>
                <th>Rutina</th>
                <th>Nivel</th>
                <th>Ejercicios</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr>
                  <td colSpan={4} className="pay-table-empty">
                    No hay rutinas. Crea la primera con ejercicios ya definidos en
                    la lista de ejercicios.
                  </td>
                </tr>
              ) : (
                slice.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{routineDifficultyLabel(row.difficulty_level)}</td>
                    <td>{row.exercise_count}</td>
                    <MmTableActions label={`Acciones de ${row.title}`}>
                      <Link
                        to={routes.rutinasEdit(row.id)}
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
