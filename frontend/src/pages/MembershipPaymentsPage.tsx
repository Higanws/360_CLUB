import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MmSearchField } from '../components/ui/MmSearchField';
import { routes } from '../config/member-management';
import { memberPortalRoutes } from '../config/member-portal';
import { api } from '../lib/api';
import { formatMoney } from '../lib/format-money';
import { useAuth } from '../context/AuthContext';

type Row = {
  mp_id: number;
  member_id: number | null;
  membership_id: number | null;
  membership_label: string | null;
  member_name: string;
  membership_amount: number;
  paid_amount: number;
  amount_owed: number;
  start_date: string | null;
  end_date: string | null;
  payment_status: string | null;
  membership_status: string | null;
};

type Payload = {
  title: string;
  subtitle: string;
  rows: Row[];
};

const PAGE_SIZE = 10;

function formatDisplayDate(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map((x) => parseInt(x, 10));
  if (!y || !m || !d) return iso;
  try {
    return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function MembershipPaymentsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [busyId, setBusyId] = useState<number | null>(null);

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
      .get<Payload>('/payments/membership/expiring-this-month')
      .then(({ data: d }) => setData(d))
      .catch((e: unknown) => {
        if (axios.isAxiosError(e) && e.response?.status === 403) {
          navigate(memberPortalRoutes.wellness, { replace: true });
          return;
        }
        setError('No se pudo cargar los cobros.');
      });
  }, [user, navigate]);

  const filtered = useMemo(() => {
    const rows = data?.rows ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.member_name.toLowerCase().includes(q) ||
        (r.membership_label ?? '').toLowerCase().includes(q),
    );
  }, [data?.rows, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount - 1);
  const slice = filtered.slice(
    pageSafe * PAGE_SIZE,
    pageSafe * PAGE_SIZE + PAGE_SIZE,
  );

  async function handlePay(mpId: number) {
    setBusyId(mpId);
    setError(null);
    try {
      await api.patch(`/payments/membership/${mpId}/paid`);
      const { data: d } = await api.get<Payload>(
        '/payments/membership/expiring-this-month',
      );
      setData(d);
    } catch {
      setError('No se pudo registrar el cobro.');
    } finally {
      setBusyId(null);
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
    <div className="mm-page pay-page">
      <header className="pay-page-head mm-page-head">
        <div>
          <h1>{data?.title ?? 'Cobro'}</h1>
          <p className="muted pay-page-sub">
            {data?.subtitle ?? 'Cobro de membresías'}
          </p>
        </div>
        <Link
          to={routes.cobroMembresiasRegistrar}
          className="btn-primary pay-btn-invoice"
        >
          <span className="pay-btn-icon" aria-hidden>
            ☰
          </span>
          Registrar cobro manual
        </Link>
      </header>

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
          placeholder="Nombre o plan"
        />
      </div>

      <section className="pay-table-wrap">
        <table className="pay-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Nombre de miembro</th>
              <th>Cantidad</th>
              <th>Importe cobrado</th>
              <th>Cantidad debida</th>
              <th>Inicio membresía</th>
              <th>Fin membresía</th>
              <th>Estado del cobro</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={9} className="pay-table-empty">
                  No hay registros de cobro con vencimiento este mes.
                </td>
              </tr>
            ) : (
              slice.map((row) => {
                const isPaid =
                  row.payment_status === '1' ||
                  row.paid_amount >= row.membership_amount;
                return (
                  <tr key={row.mp_id}>
                    <td>{row.membership_label ?? '—'}</td>
                    <td>{row.member_name}</td>
                    <td>{formatMoney(row.membership_amount)}</td>
                    <td>{formatMoney(row.paid_amount)}</td>
                    <td>{formatMoney(row.amount_owed)}</td>
                    <td>{formatDisplayDate(row.start_date)}</td>
                    <td>{formatDisplayDate(row.end_date)}</td>
                    <td>
                      <span
                        className={
                          isPaid
                            ? 'pay-badge pay-badge--paid'
                            : 'pay-badge pay-badge--unpaid'
                        }
                      >
                        {isPaid ? 'Cobrado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="pay-actions">
                      {!isPaid ? (
                        <button
                          type="button"
                          className="btn-table pay-action-pay"
                          disabled={busyId === row.mp_id}
                          onClick={() => void handlePay(row.mp_id)}
                        >
                          {busyId === row.mp_id ? '…' : 'Cobrar'}
                        </button>
                      ) : null}
                      {row.member_id != null ? (
                        <Link
                          to={routes.sociosDetail(row.member_id)}
                          className="btn-table btn-table--link pay-action-view"
                          title="Ver socio"
                        >
                          Ver
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
