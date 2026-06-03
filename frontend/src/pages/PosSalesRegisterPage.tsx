import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { bindDateRange } from '../lib/date-range';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../config/member-management';
import { memberPortalRoutes } from '../config/member-portal';
import { api } from '../lib/api';
import { posPaymentLabel } from '../lib/pos-payment';
import { extractApiMessage } from '../lib/extract-api-message';
import { formatMoney } from '../lib/format-money';
import { MmDatePicker } from '../components/ui/MmDatePicker';
import { MmSelect } from '../components/ui/MmSelect';
import { useAuth } from '../context/AuthContext';
import {
  DEFAULT_PAGE_SIZE,
  pageRangeLabel,
} from '../lib/pagination';
import { usePosSalesList } from '../lib/queries/lists';

type SaleRow = {
  id: number;
  total_amount: number;
  created_at: string;
  payment_method: string;
  created_by: number | null;
  seller_username: string | null;
};

function fmtLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-ES');
  } catch {
    return iso;
  }
}

export function PosSalesRegisterPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const initialFrom = fmtLocalDate(startOfMonth(new Date()));
  const initialTo = fmtLocalDate(new Date());
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [applied, setApplied] = useState({ from: initialFrom, to: initialTo });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const metricsEnabled = !!user;
  const { data, isFetching, isError, error: queryError } = usePosSalesList(
    applied.from,
    applied.to,
    page,
    pageSize,
    metricsEnabled,
  );

  const rows = (data?.sales ?? []) as SaleRow[];
  const meta = data?.meta ?? null;

  const salesRange = useMemo(
    () => bindDateRange(from, to, setFrom, setTo),
    [from, to],
  );

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const r = user.role_name?.trim().toLowerCase() ?? '';
    if (r === 'member') navigate(memberPortalRoutes.wellness, { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (isError) {
      if (axios.isAxiosError(queryError) && queryError.response?.status === 400) {
        setError(extractApiMessage(queryError) ?? 'Revisa el rango de fechas.');
      } else {
        setError(extractApiMessage(queryError) ?? 'No se pudieron cargar las ventas.');
      }
    } else {
      setError(null);
    }
  }, [isError, queryError]);

  function consult() {
    setApplied({ from, to });
    setPage(1);
  }

  const showPager = meta && meta.pageCount > 1;
  const totalPeriod = useMemo(
    () => rows.reduce((s, r) => s + Number(r.total_amount), 0),
    [rows],
  );

  async function downloadCsv() {
    setError(null);
    setExporting(true);
    try {
      const res = await api.get<Blob>('/pos/sales/export', {
        params: { from: applied.from, to: applied.to },
        responseType: 'blob',
      });
      const blob =
        res.data instanceof Blob
          ? res.data
          : new Blob([res.data as BlobPart], {
              type: 'text/csv;charset=utf-8',
            });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ventas_${applied.from}_${applied.to}.csv`;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.data instanceof Blob) {
        const text = await e.response.data.text();
        try {
          const j = JSON.parse(text) as { message?: string };
          setError(j.message ?? 'Error al exportar.');
        } catch {
          setError(text || 'Error al exportar.');
        }
      } else {
        setError(extractApiMessage(e) ?? 'No se pudo exportar.');
      }
    } finally {
      setExporting(false);
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
    <div className="mm-page pos-page">
      <header className="mm-page-head">
        <div>
          <h1>Registro de ventas</h1>
          <p className="muted">
            <span className="members-breadcrumb">Venta y Stock</span>
          </p>
        </div>
        <Link to={routes.puntoVentaVender} className="btn-outline">
          Vender producto
        </Link>
      </header>

      {error ? <p className="login-error">{error}</p> : null}

      <section className="pos-panel pos-panel--sales-register">
        <div className="pay-toolbar mm-filter-toolbar">
          <label>
            Desde
            <MmDatePicker
              value={salesRange.desde}
              onChange={salesRange.onDesdeChange}
              max={salesRange.maxDesde}
              aria-label="Ventas desde"
            />
          </label>
          <label>
            Hasta
            <MmDatePicker
              value={salesRange.hasta}
              onChange={salesRange.onHastaChange}
              min={salesRange.minHasta}
              aria-label="Ventas hasta"
            />
          </label>
          <button
            type="button"
            className="btn-primary"
            disabled={isFetching}
            onClick={consult}
          >
            {isFetching ? 'Cargando…' : 'Consultar'}
          </button>
          <button
            type="button"
            className="btn-outline"
            disabled={exporting || rows.length === 0}
            onClick={() => void downloadCsv()}
          >
            {exporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
        </div>
        <p className="muted pay-footer-note">
          Total del periodo mostrado: <strong>{formatMoney(totalPeriod)}</strong>
          {meta ? (
            <>
              {' '}
              · <span className="muted">{pageRangeLabel(meta)}</span>
            </>
          ) : null}
        </p>

        {showPager ? (
          <div className="members-toolbar members-pagination-toolbar">
            <div className="members-pagination">
              <button
                type="button"
                className="btn-outline"
                disabled={page <= 1 || isFetching}
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
                disabled={page >= meta!.pageCount || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </button>
            </div>
            <label className="members-page-size">
              <span className="muted small">Por página</span>
              <MmSelect
                value={String(pageSize)}
                disabled={isFetching}
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

        <div className="members-table-wrap">
          <table className="members-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Método de pago</th>
                <th>Vendedor</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="pay-table-empty">
                    {isFetching ? 'Cargando…' : 'No hay ventas en este rango.'}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{formatWhen(r.created_at)}</td>
                    <td>{formatMoney(r.total_amount)}</td>
                    <td>{posPaymentLabel(r.payment_method)}</td>
                    <td>
                      {r.seller_username ?? '—'}
                      {r.created_by != null ? (
                        <span className="muted"> ({r.created_by})</span>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
