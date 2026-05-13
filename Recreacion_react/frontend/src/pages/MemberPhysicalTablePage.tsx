import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { routes } from '../config/member-management';
import { memberPortalRoutes } from '../config/member-portal';
import { api } from '../lib/api';
import { extractApiMessage } from '../lib/extract-api-message';
import { useAuth } from '../context/AuthContext';

type MemberDetail = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  member_id: string | null;
  physical_weight_kg: number | null;
  physical_height_cm: number | null;
  physical_chest_cm: number | null;
  physical_waist_cm: number | null;
  physical_thigh_cm: number | null;
  physical_arms_cm: number | null;
  physical_fat_percent: number | null;
};

function fmt(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return String(v);
}

export function MemberPhysicalTablePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [member, setMember] = useState<MemberDetail | null>(null);
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
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!id || !user) return;
    api
      .get<{ member: MemberDetail }>(`/members/${id}`)
      .then(({ data }) => setMember(data.member))
      .catch((e: unknown) =>
        setError(extractApiMessage(e) || 'No se pudo cargar el socio.'),
      );
  }, [id, user]);

  if (loading || !user) {
    return (
      <div className="mm-page">
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  const name = member
    ? [member.first_name, member.last_name].filter(Boolean).join(' ').trim()
    : '';

  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <h1>Tabla física</h1>
          <p className="muted">
            Medidas corporales del socio (peso, altura, perímetros, % grasa).
          </p>
        </div>
        <div className="members-toolbar">
          <Link to={routes.socios} className="btn-outline">
            Lista socios
          </Link>
          {member ? (
            <Link
              to={routes.sociosEdit(member.id)}
              className="btn-primary"
            >
              Editar datos
            </Link>
          ) : null}
        </div>
      </header>

      {error ? <p className="login-error">{error}</p> : null}

      {member ? (
        <section className="home-card members-panel">
          <p className="muted" style={{ marginBottom: '1rem' }}>
            <strong>{name || 'Socio'}</strong>
            {member.member_id ? (
              <>
                {' '}
                · ID socio: <span>{member.member_id}</span>
              </>
            ) : null}
          </p>
          <div className="members-table-wrap">
            <table className="members-table">
              <tbody>
                <tr>
                  <th scope="row">Peso (kg)</th>
                  <td>{fmt(member.physical_weight_kg)}</td>
                </tr>
                <tr>
                  <th scope="row">Altura (cm)</th>
                  <td>{fmt(member.physical_height_cm)}</td>
                </tr>
                <tr>
                  <th scope="row">Pecho (cm)</th>
                  <td>{fmt(member.physical_chest_cm)}</td>
                </tr>
                <tr>
                  <th scope="row">Cintura (cm)</th>
                  <td>{fmt(member.physical_waist_cm)}</td>
                </tr>
                <tr>
                  <th scope="row">Muslo (cm)</th>
                  <td>{fmt(member.physical_thigh_cm)}</td>
                </tr>
                <tr>
                  <th scope="row">Brazos (cm)</th>
                  <td>{fmt(member.physical_arms_cm)}</td>
                </tr>
                <tr>
                  <th scope="row">% grasa corporal</th>
                  <td>{fmt(member.physical_fat_percent)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ marginTop: '1rem' }}>
            Los valores se registran en el formulario de socio (sección Información
            física).
          </p>
        </section>
      ) : !error ? (
        <p className="muted">Cargando datos…</p>
      ) : null}
    </div>
  );
}
