import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../config/member-management';
import { memberPortalRoutes } from '../config/member-portal';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type Row = {
  id: number;
  membership_label: string | null;
  membership_amount: number | null;
  membership_period_days: number | null;
  installment_plan: string | null;
  signup_fee: number | null;
  description: string | null;
  image: string | null;
};

type Payload = {
  title: string;
  subtitle: string;
  memberships: Row[];
};

const PAGE_SIZE = 10;
const uploadBase = import.meta.env.VITE_UPLOAD_BASE as string | undefined;

function formatMoney(n: number | null | undefined): string {
  const v = n ?? 0;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(v);
}

function PlanPhoto({
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

export function MembershipPlansPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const isAdmin =
    user?.role_name?.trim().toLowerCase() === 'administrator';

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
      .get<Payload>('/memberships')
      .then(({ data: d }) => setData(d))
      .catch((e: unknown) => {
        if (axios.isAxiosError(e) && e.response?.status === 403) {
          navigate(memberPortalRoutes.wellness, { replace: true });
          return;
        }
        setError('No se pudo cargar la lista de membresías.');
      });
  }, [user, navigate]);

  const filtered = useMemo(() => {
    const rows = data?.memberships ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.membership_label ?? '').toLowerCase().includes(q) ||
        (r.installment_plan ?? '').toLowerCase().includes(q),
    );
  }, [data?.memberships, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount - 1);
  const slice = filtered.slice(
    pageSafe * PAGE_SIZE,
    pageSafe * PAGE_SIZE + PAGE_SIZE,
  );

  async function handleDelete(id: number) {
    if (
      !confirm(
        '¿Eliminar esta membresía? No podrá borrarse si hay cobros asociados.',
      )
    ) {
      return;
    }
    try {
      await api.delete(`/memberships/${id}`);
      const { data: d } = await api.get<Payload>('/memberships');
      setData(d);
      setError(null);
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.data?.message) {
        const msg = Array.isArray(e.response.data.message)
          ? e.response.data.message.join(' ')
          : String(e.response.data.message);
        setError(msg);
        return;
      }
      setError('No se pudo eliminar la membresía.');
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
          <h1>{data?.title ?? 'Lista de membresías'}</h1>
          <p className="muted">
            <span className="members-breadcrumb">
              {data?.subtitle ?? 'Afiliación'}
            </span>
          </p>
        </div>
      </header>

      {isAdmin ? (
        <div className="members-toolbar">
          <Link to={routes.membresiasNew} className="btn-primary">
            + Agregar una membresía
          </Link>
        </div>
      ) : null}

      {error ? <p className="login-error">{error}</p> : null}

      <div className="pay-toolbar">
        <span className="muted">Mostrar entradas</span>
        <label className="pay-search">
          <span>Buscar:</span>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Nombre o plan de cuotas"
          />
        </label>
      </div>

      <section className="members-panel">
        <div className="members-table-wrap">
          <table className="members-table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Nombre de membresía</th>
                <th>Cantidad</th>
                <th>Periodo de membresía</th>
                <th>Plan de instalación</th>
                <th>Tarifa de registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr>
                  <td colSpan={7} className="pay-table-empty">
                    No hay membresías que mostrar.
                  </td>
                </tr>
              ) : (
                slice.map((row) => {
                  const name = row.membership_label ?? '—';
                  return (
                    <tr key={row.id}>
                      <td>
                        <PlanPhoto
                          filename={row.image}
                          label={name}
                        />
                      </td>
                      <td>{name}</td>
                      <td>{formatMoney(row.membership_amount)}</td>
                      <td>
                        {row.membership_period_days != null
                          ? row.membership_period_days
                          : '—'}
                      </td>
                      <td>{row.installment_plan ?? '—'}</td>
                      <td>{formatMoney(row.signup_fee)}</td>
                      <td className="members-actions">
                        {isAdmin ? (
                          <Link
                            to={routes.membresiasEdit(row.id)}
                            className="btn-table btn-table--link"
                          >
                            Editar
                          </Link>
                        ) : null}
                        {isAdmin ? (
                          <button
                            type="button"
                            className="btn-table btn-table--danger"
                            onClick={() => void handleDelete(row.id)}
                          >
                            Borrar
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="btn-table"
                          disabled
                          title="Próximamente"
                        >
                          Ocupaciones
                        </button>
                      </td>
                    </tr>
                  );
                })
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
