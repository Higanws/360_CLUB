import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MemberAvatar } from '../components/mm/MemberAvatar';
import { MmTableActions } from '../components/mm/MmTableActions';
import { PageLoading } from '../components/mm/PageLoading';
import { routes } from '../config/member-management';
import { memberPortalRoutes } from '../config/member-portal';
import { useGestionAuth } from '../hooks/useGestionAuth';
import { api } from '../lib/api';
import { apiErrorStatus } from '../lib/is-api-error';

type StaffPayload = {
  staff: Array<{
    id: number;
    first_name: string | null;
    last_name: string | null;
    image: string | null;
    email: string | null;
    mobile: string | null;
    club_role_name: string | null;
  }>;
  meta: {
    can_manage: boolean;
    is_administrator: boolean;
  };
};

export function StaffListPage() {
  useGestionAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<StaffPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este miembro del personal?')) return;
    try {
      await api.delete(`/staff/${id}`);
      const { data: d } = await api.get<StaffPayload>('/staff');
      setData(d);
      setError(null);
    } catch {
      setError('No se pudo eliminar.');
    }
  }

  useEffect(() => {
    setLoadingData(true);
    api
      .get<StaffPayload>('/staff')
      .then(({ data: d }) => setData(d))
      .catch((e: unknown) => {
        if (apiErrorStatus(e) === 403) {
          navigate(memberPortalRoutes.wellness, { replace: true });
          return;
        }
        setError('No se pudo cargar el personal.');
      })
      .finally(() => setLoadingData(false));
  }, [navigate]);

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
