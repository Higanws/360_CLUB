import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../config/member-management';
import { memberPortalRoutes } from '../config/member-portal';
import { api } from '../lib/api';
import { posPaymentLabel } from '../lib/pos-payment';
import { extractApiMessage } from '../lib/extract-api-message';
import { formatMoney } from '../lib/format-money';
import { useAuth } from '../context/AuthContext';

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
    const d = new Date(iso);
    return d.toLocaleString('es-ES');
  } catch {
    return iso;
  }
}

export function PosSalesRegisterPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [from, setFrom] = useState(() => fmtLocalDate(startOfMonth(new Date())));
  const [to, setTo] = useState(() => fmtLocalDate(new Date()));
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const r = user.role_name?.trim().toLowerCase() ?? '';
    if (r === 'member') navigate(memberPortalRoutes.wellness, { replace: true });
  }, [user, navigate]);

  async function loadSales() {
    setError(null);
    setLoadingSales(true);
    try {
      const { data } = await api.get<SaleRow[]>('/pos/sales', {
        params: { from, to },
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 400) {
        setError(extractApiMessage(e) ?? 'Revisa el rango de fechas.');
      } else {
        setError(extractApiMessage(e) ?? 'No se pudieron cargar las ventas.');
      }
      setRows([]);
    } finally {
      setLoadingSales(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    void loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recarga al cambiar rango con botón o montaje
  }, [user]);

  const totalPeriod = useMemo(
    () => rows.reduce((s, r) => s + Number(r.total_amount), 0),
    [rows],
  );

  async function downloadCsv() {
    setError(null);
    setExporting(true);
    try {
      const res = await api.get<Blob>('/pos/sales/export', {
        params: { from, to },
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
      a.download = `ventas_${from}_${to}.csv`;
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
        <div className="pay-toolbar">
          <label>
            Desde
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn-primary"
            disabled={loadingSales}
            onClick={() => void loadSales()}
          >
            {loadingSales ? 'Cargando…' : 'Consultar'}
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
          Total del periodo mostrado: <strong>{formatMoney(totalPeriod)}</strong>{' '}
          ({rows.length} venta{rows.length === 1 ? '' : 's'})
        </p>

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
                    No hay ventas en este rango.
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
