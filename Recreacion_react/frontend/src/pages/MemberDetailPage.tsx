import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { routes } from '../config/member-management';
import { memberPortalRoutes } from '../config/member-portal';
import { api } from '../lib/api';
import { extractApiMessage } from '../lib/extract-api-message';
import { genderLabelEs } from '../lib/gender-options';
import { useAuth } from '../context/AuthContext';

type MemberDetail = {
  id: number;
  activated: number | null;
  member_id: string | null;
  di_dni_type: string | null;
  di_dni_number: string | null;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  birth_date: string | null;
  email: string | null;
  username: string | null;
  mobile: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  image: string | null;
  assign_staff_mem: number | null;
  selected_membership: string | null;
  membership_status: string | null;
  membership_valid_from: string | null;
  membership_valid_to: string | null;
  inquiry_date: string | null;
  trial_end_date: string | null;
  first_pay_date: string | null;
  created_date: string | null;
  assign_class_ids: number[];
};

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user || !id) return;
    const r = user.role_name?.trim().toLowerCase() ?? '';
    if (r === 'member') {
      navigate(memberPortalRoutes.wellness, { replace: true });
      return;
    }
    api
      .get<{ member: MemberDetail }>(`/members/${id}`)
      .then(({ data }) => setMember(data.member))
      .catch((e) => setError(extractApiMessage(e) || 'No se pudo cargar el socio.'));
  }, [user, id, navigate]);

  async function handleDelete() {
    if (!id || !confirm('¿Eliminar definitivamente este socio?')) return;
    setBusy(true);
    setError(null);
    try {
      await api.delete(`/members/${id}`);
      navigate(routes.socios, { replace: true });
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

  const name = [member?.first_name, member?.last_name].filter(Boolean).join(' ');

  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <h1>Ficha de socio</h1>
          <p className="muted">{member?.member_id ?? '—'} · {name || '—'}</p>
        </div>
        <Link to={routes.socios} className="btn-outline">
          Lista
        </Link>
      </header>

      {error ? <p className="login-error">{error}</p> : null}

      {member ? (
        <section className="member-detail-grid">
          <div className="home-card member-detail-card">
            <h2 className="member-detail-h2">Datos principales</h2>
            <dl className="member-dl">
              <dt>Usuario acceso</dt>
              <dd>{member.username ?? '—'}</dd>
              <dt>Email</dt>
              <dd>{member.email ?? '—'}</dd>
              <dt>Teléfonos</dt>
              <dd>
                {member.mobile ?? '—'} / {member.phone ?? '—'}
              </dd>
              <dt>Documento</dt>
              <dd>
                {member.di_dni_type ?? '—'} {member.di_dni_number ?? ''}
              </dd>
              <dt>Estado membresía</dt>
              <dd>{member.membership_status ?? '—'}</dd>
              <dt>Vigencia</dt>
              <dd>
                {member.membership_valid_from ?? '—'} →{' '}
                {member.membership_valid_to ?? '—'}
              </dd>
              <dt>Cuenta activada</dt>
              <dd>{member.activated === 1 ? 'Sí' : 'No'}</dd>
            </dl>
          </div>
          <div className="home-card member-detail-card">
            <h2 className="member-detail-h2">Contacto y dirección</h2>
            <dl className="member-dl">
              <dt>Dirección</dt>
              <dd>{member.address ?? '—'}</dd>
              <dt>Ciudad / provincia / CP</dt>
              <dd>
                {member.city ?? '—'}, {member.state ?? '—'} {member.zipcode ?? ''}
              </dd>
              <dt>Género / nacimiento</dt>
              <dd>
                {genderLabelEs(member.gender)} · {member.birth_date ?? '—'}
              </dd>
              <dt>Clases asignadas (ids)</dt>
              <dd>
                {member.assign_class_ids?.length
                  ? member.assign_class_ids.join(', ')
                  : '—'}
              </dd>
              <dt>Plan (id)</dt>
              <dd>{member.selected_membership ?? '—'}</dd>
              <dt>Staff asignado (id)</dt>
              <dd>{member.assign_staff_mem ?? '—'}</dd>
            </dl>
          </div>
          <div className="member-detail-actions">
            <Link
              to={routes.sociosEdit(member.id)}
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
        </section>
      ) : !error ? (
        <p className="muted">Cargando ficha…</p>
      ) : null}
    </div>
  );
}
