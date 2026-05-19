import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MmSelect } from '../components/ui/MmSelect';
import { MemberAvatar } from '../components/mm/MemberAvatar';
import { MmTableActions } from '../components/mm/MmTableActions';
import { PageLoading } from '../components/mm/PageLoading';
import { routes } from '../config/member-management';
import { memberPortalRoutes } from '../config/member-portal';
import { useGestionAuth } from '../hooks/useGestionAuth';
import { api } from '../lib/api';
import { apiErrorStatus } from '../lib/is-api-error';
import {
  fetchMembersListPage,
  type MembersListApiPayload,
} from '../lib/members-api';

function formatClubDate(
  iso: string | null,
  pattern: string | null | undefined,
): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map((x) => parseInt(x, 10));
  if (!y || !m || !d) return iso;
  const safePattern = (pattern ?? '').toLowerCase();
  if (safePattern.includes('d/m/y')) {
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }
  if (safePattern.includes('m/d/y')) {
    return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`;
  }
  if (safePattern.includes('y-m-d')) {
    return iso;
  }
  try {
    return new Date(y, m - 1, d).toLocaleDateString('es-ES');
  } catch {
    return iso;
  }
}

function todayIso(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function MembersPage() {
  useGestionAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<MembersListApiPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setLoadingData(true);
    fetchMembersListPage(page, pageSize)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e: unknown) => {
        if (apiErrorStatus(e) === 403) {
          navigate(memberPortalRoutes.wellness, { replace: true });
          return;
        }
        setError('No se pudo cargar la lista de socios.');
      })
      .finally(() => setLoadingData(false));
  }, [page, pageSize, navigate]);

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este socio? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      await api.delete(`/members/${id}`);
      let p = page;
      let d = await fetchMembersListPage(p, pageSize);
      if (d.members.length === 0 && d.meta.total > 0 && p > 1) {
        p -= 1;
        setPage(p);
        d = await fetchMembersListPage(p, pageSize);
      }
      setData(d);
      setError(null);
    } catch {
      setError('No se pudo eliminar el socio.');
    }
  }

  const today = todayIso();

  if (loadingData && !data) {
    return <PageLoading message="Cargando socios…" />;
  }

  const df = data?.meta.date_format;
  const meta = data?.meta;
  const showPager = meta && meta.pageCount > 1;

  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <h1>{data?.title ?? 'Lista de socios'}</h1>
          <p className="muted">
            <span className="members-breadcrumb">
              {data?.subtitle ?? 'Socios'}
            </span>
            {meta && meta.total > 0 ? (
              <>
                {' '}
                · <span className="muted">{meta.total} socios</span>
              </>
            ) : null}
          </p>
        </div>
      </header>

      {data?.meta.can_add_member ? (
        <div className="members-toolbar">
          <Link to={routes.sociosNew} className="btn-primary">
            + Añadir socio
          </Link>
        </div>
      ) : null}

      {showPager ? (
        <div className="members-toolbar members-pagination-toolbar">
          <div className="members-pagination">
            <button
              type="button"
              className="btn-outline"
              disabled={page <= 1 || loadingData}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            <span className="muted small members-pagination-status">
              Página {meta.page} de {meta.pageCount}
            </span>
            <button
              type="button"
              className="btn-outline"
              disabled={page >= meta.pageCount || loadingData}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
          <label className="members-page-size">
            <span className="muted small">Por página</span>
            <MmSelect
              value={String(pageSize)}
              disabled={loadingData}
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

      {error ? <p className="login-error">{error}</p> : null}

      <section className="members-panel mm-data-panel">
        <div className="members-table-wrap">
          <table className="members-table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Nombre</th>
                <th>ID socio</th>
                <th>Alta</th>
                <th>Caducidad</th>
                <th>Estado membresía</th>
                <th>Acciones</th>
                {data?.meta.show_status_column ? <th>Estado cuenta</th> : null}
              </tr>
            </thead>
            <tbody>
              {(data?.members ?? []).map((row) => {
                const name = [row.first_name, row.last_name]
                  .filter(Boolean)
                  .join(' ')
                  .trim();
                const expired =
                  row.membership_valid_to != null &&
                  row.membership_valid_to !== '' &&
                  row.membership_valid_to < today;

                return (
                  <tr key={row.id}>
                    <td>
                      <MemberAvatar
                        filename={row.image}
                        label={name || row.member_id || '?'}
                      />
                    </td>
                    <td>{name || '—'}</td>
                    <td>{row.member_id ?? '—'}</td>
                    <td>{formatClubDate(row.membership_valid_from ?? null, df)}</td>
                    <td>{formatClubDate(row.membership_valid_to ?? null, df)}</td>
                    <td>{row.membership_status ?? '—'}</td>
                    <MmTableActions label={`Acciones de ${name || row.member_id || 'socio'}`}>
                      <Link
                        to={routes.sociosPhysical(row.id)}
                        className="btn-table btn-table--link"
                      >
                        Tabla física
                      </Link>
                      <Link
                        to={routes.sociosDetail(row.id)}
                        className="btn-table btn-table--link"
                      >
                        Ver
                      </Link>
                      <Link
                        to={routes.sociosEdit(row.id)}
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
                      <button type="button" className="btn-table" disabled title="Próximamente">
                        Asistencia
                      </button>
                    </MmTableActions>
                    {data?.meta.show_status_column ? (
                      <td>
                        {row.activated !== 1 ? (
                          <span className="member-status member-status--pending">
                            Pendiente activación
                          </span>
                        ) : expired ? (
                          <span className="member-status member-status--danger">
                            Caducado
                          </span>
                        ) : (
                          <span className="member-status member-status--ok">
                            Activo
                          </span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!data?.members.length && !error ? (
          <p className="muted members-empty">No hay socios que mostrar.</p>
        ) : null}
      </section>
    </div>
  );
}
