import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { routes } from '../config/member-management';
import { memberPortalRoutes } from '../config/member-portal';
import { useAuth } from '../context/AuthContext';

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

const uploadBase = import.meta.env.VITE_UPLOAD_BASE as string | undefined;

function StaffAvatar({
  filename,
  label,
}: {
  filename: string | null;
  label: string;
}) {
  const [broken, setBroken] = useState(false);
  const src =
    filename && uploadBase
      ? `${uploadBase.replace(/\/$/, '')}/${filename}`
      : null;
  if (src && !broken) {
    return (
      <img
        className="members-photo"
        src={src}
        alt=""
        onError={() => setBroken(true)}
      />
    );
  }
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <div className="members-photo members-photo--fallback" aria-hidden>
      {initials || '?'}
    </div>
  );
}

export function StaffListPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<StaffPayload | null>(null);
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
      .get<StaffPayload>('/staff')
      .then(({ data: d }) => setData(d))
      .catch((e: unknown) => {
        if (axios.isAxiosError(e) && e.response?.status === 403) {
          navigate(memberPortalRoutes.wellness, { replace: true });
          return;
        }
        setError('No se pudo cargar el personal.');
      });
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

      <section className="members-panel">
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
                      <StaffAvatar
                        filename={row.image}
                        label={name || '?'}
                      />
                    </td>
                    <td>{name || '—'}</td>
                    <td>{row.club_role_name ?? '—'}</td>
                    <td>{row.email ?? '—'}</td>
                    <td>{row.mobile ?? '—'}</td>
                    <td className="members-actions">
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
                    </td>
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
}
