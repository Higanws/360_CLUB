import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MmSelect } from '../components/ui/MmSelect';
import { routes } from '../config/member-management';
import { memberPortalRoutes } from '../config/member-portal';
import { api } from '../lib/api';
import { formatMoney } from '../lib/format-money';
import {
  DEFAULT_PAGE_SIZE,
  pageRangeLabel,
} from '../lib/pagination';
import { useMembershipPaymentsList } from '../lib/queries/lists';
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


export function MembershipPaymentsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [busyId, setBusyId] = useState<number | null>(null);

  const { data, isLoading, isError } = useMembershipPaymentsList(page, pageSize);
  const rows = (data?.rows ?? []) as Row[];
  const meta = data?.meta;

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const r = user.role_name?.trim().toLowerCase() ?? '';
    if (r === 'member') navigate(memberPortalRoutes.wellness, { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (isError) setError('No se pudo cargar los cobros.');
    else setError(null);
  }, [isError]);

  async function handlePay(mpId: number) {
    setBusyId(mpId);
    setError(null);
    try {
      await api.patch(`/payments/membership/${mpId}/paid`);
      await queryClient.invalidateQueries({
        queryKey: ['membership-payments', 'expiring'],
      });
    } catch {
      setError('No se pudo registrar el cobro.');
    } finally {
      setBusyId(null);
    }
  }

  const showPager = meta && meta.pageCount > 1;

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
      {meta ? (
        <p className="muted small pay-footer-note">{pageRangeLabel(meta)}</p>
      ) : null}

      {showPager ? (
        <footer className="pay-pagination">
          <button
            type="button"
            className="btn-outline"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </button>
          <span className="muted">
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
        </footer>
      ) : null}

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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="pay-table-empty">
                  {isLoading
                    ? 'Cargando…'
                    : 'No hay registros de cobro con vencimiento este mes.'}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
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
    </div>
  );
}
