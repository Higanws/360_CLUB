import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { MmSearchField } from '../components/ui/MmSearchField';
import { MmSelect } from '../components/ui/MmSelect';
import { MemberAvatar } from '../components/mm/MemberAvatar';
import { MmTableActions } from '../components/mm/MmTableActions';
import { PageLoading } from '../components/mm/PageLoading';
import { routes } from '../config/member-management';
import { memberPortalRoutes } from '../config/member-portal';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useGestionAuth } from '../hooks/useGestionAuth';
import { api } from '../lib/api';
import { apiErrorStatus } from '../lib/is-api-error';
import { useStaffList } from '../lib/queries/staff';
import {
  DEFAULT_PAGE_SIZE,
  pageRangeLabel,
} from '../lib/pagination';

export function StaffListPage() {
  useGestionAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filterQuery, setFilterQuery] = useState('');
  const debouncedQuery = useDebouncedValue(filterQuery, 300);
  const { data, isLoading, isError, error: queryError } = useStaffList(
    page,
    pageSize,
    debouncedQuery,
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  useEffect(() => {
    if (isError && apiErrorStatus(queryError) === 403) {
      navigate(memberPortalRoutes.wellness, { replace: true });
    } else if (isError) {
      setError('No se pudo cargar el personal.');
    } else {
      setError(null);
    }
  }, [isError, queryError, navigate]);

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este miembro del personal?')) return;
    try {
      await api.delete(`/staff/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['staff', 'list'] });
      setError(null);
    } catch {
      setError('No se pudo eliminar.');
    }
  }

  const loadingData = isLoading && !data;
  const meta = data?.meta;
  const showPager = meta && meta.pageCount > 1;

  if (loadingData && !data) {
    return <PageLoading message="Cargando personal…" />;
  }

  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <h1>Lista de personal</h1>
          <p className="muted">Miembro del equipo</p>
        </div>
        {data?.meta.can_manage ? (
          <Link to={routes.personalNew} className="btn-primary">
            + Añadir miembro del personal
          </Link>
        ) : null}
      </header>

      {error ? <p className="login-error">{error}</p> : null}

      <div className="pay-toolbar">
        <MmSearchField
          grow
          label="Buscar"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Nombre o email…"
          autoComplete="off"
        />
      </div>

      {meta && meta.total > 0 ? (
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
            <span className="muted small members-pagination-status">
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
                <th>Foto</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Email</th>
                <th>Móvil</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(data?.staff ?? []).map((row) => {
                const name = [row.first_name, row.last_name]
                  .filter(Boolean)
                  .join(' ')
                  .trim();
                return (
                  <tr key={row.id}>
                    <td>
                      <MemberAvatar
                        filename={row.image}
                        label={name || '?'}
                      />
                    </td>
                    <td>{name || '—'}</td>
                    <td>{row.club_role_name ?? '—'}</td>
                    <td>{row.email ?? '—'}</td>
                    <td>{row.mobile ?? '—'}</td>
                    <MmTableActions label={`Acciones de ${name || 'personal'}`}>
                      <Link
                        to={routes.personalDetail(row.id)}
                        className="btn-table btn-table--link"
                      >
                        Ver
                      </Link>
                      {data?.meta.is_administrator ? (
                        <>
                          <Link
                            to={routes.personalEdit(row.id)}
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
                        </>
                      ) : null}
                    </MmTableActions>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!data?.staff.length && !error ? (
          <p className="muted members-empty">No hay registros.</p>
        ) : null}
      </section>
    </div>
  );
}
