import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { extractApiMessage } from '../lib/extract-api-message';
import { genderLabelEs } from '../lib/gender-options';
import { routes } from '../config/member-management';
import { useAuth } from '../context/AuthContext';

type StaffDetail = {
  id: number;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  gender: string | null;
  birth_date: string | null;
  role: number | null;
  club_role_name: string | null;
  specialization_ids: number[];
  specialization_labels: string[];
  address: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  mobile: string | null;
  phone: string | null;
  email: string | null;
  username: string | null;
  image: string | null;
  activated: number | null;
};

export function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isAdmin =
    user?.role_name?.trim().toLowerCase() === 'administrator';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user || !id) return;
    api
      .get<{ staff: StaffDetail }>(`/staff/${id}`)
      .then(({ data }) => setStaff(data.staff))
      .catch((e) => setError(extractApiMessage(e) || 'No se pudo cargar la ficha.'));
  }, [user, id]);

  async function handleDelete() {
    if (!id || !confirm('¿Eliminar este usuario del personal?')) return;
    setBusy(true);
    try {
      await api.delete(`/staff/${id}`);
      navigate(routes.personal, { replace: true });
    } catch (e: unknown) {
      setError(extractApiMessage(e) || 'No se pudo eliminar.');
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="mm-page">
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  const name = [staff?.first_name, staff?.last_name].filter(Boolean).join(' ');

  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <h1>Ficha de personal</h1>
          <p className="muted">{name || '—'}</p>
        </div>
      </header>

      {error ? <p className="login-error">{error}</p> : null}

      {staff ? (
        <>
          <section className="member-detail-grid">
            <div className="home-card member-detail-card">
              <h2 className="member-detail-h2">Datos</h2>
              <dl className="member-dl">
                <dt>Usuario</dt>
                <dd>{staff.username ?? '—'}</dd>
                <dt>Email</dt>
                <dd>{staff.email ?? '—'}</dd>
                <dt>Móvil / teléfono</dt>
                <dd>
                  {staff.mobile ?? '—'} / {staff.phone ?? '—'}
                </dd>
                <dt>Rol en el club</dt>
                <dd>{staff.club_role_name ?? '—'}</dd>
                <dt>Especialización</dt>
                <dd>
                  {staff.specialization_labels?.length
                    ? staff.specialization_labels.join(', ')
                    : '—'}
                </dd>
                <dt>Género / nacimiento</dt>
                <dd>
                  {genderLabelEs(staff.gender)} · {staff.birth_date ?? '—'}
                </dd>
                <dt>Cuenta activa</dt>
                <dd>{staff.activated === 1 ? 'Sí' : 'No'}</dd>
              </dl>
            </div>
            <div className="home-card member-detail-card">
              <h2 className="member-detail-h2">Dirección</h2>
              <dl className="member-dl">
                <dt>Dirección</dt>
                <dd>{staff.address ?? '—'}</dd>
                <dt>Ciudad</dt>
                <dd>{staff.city ?? '—'}</dd>
                <dt>Provincia / CP</dt>
                <dd>
                  {staff.state ?? '—'} {staff.zipcode ?? ''}
                </dd>
              </dl>
            </div>
          </section>
          {isAdmin ? (
            <div className="member-detail-actions">
              <Link
                to={routes.personalEdit(staff.id)}
                className="btn-primary"
              >
                Editar
              </Link>
              <button
                type="button"
                className="btn-danger"
                disabled={busy}
                onClick={() => void handleDelete()}
              >
                {busy ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          ) : null}
        </>
      ) : !error ? (
        <p className="muted">Cargando…</p>
      ) : null}
    </div>
  );
}
