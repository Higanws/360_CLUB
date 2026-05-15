import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { memberPortalRoutes } from '../../config/member-portal';
import { routes } from '../../config/member-management';
import { api } from '../../lib/api';
import { formatMoney } from '../../lib/format-money';
import { useAuth } from '../../context/AuthContext';

type BusinessMetrics = {
  generated_at: string;
  summary: {
    members: number;
    staff: number;
    active_members: number;
    membership_plans: number;
    catalog_products: number;
    exercises: number;
    training_routines: number;
    nutrition_plans: number;
  };
  membership_debt: {
    pending_invoices: number;
    total_owed: number;
  };
  sales_last_30d: Array<{
    date: string;
    revenue: number;
    sales_count: number;
  }>;
  access_last_14d: Array<{
    date: string;
    allowed: number;
    denied: number;
  }>;
};

function shortDate(ymd: string): string {
  const [, m, d] = ymd.split('-');
  return m && d ? `${m}/${d}` : ymd;
}

export function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<BusinessMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      .get<BusinessMetrics>('/dashboard/business-metrics')
      .then(({ data: d }) => {
        setData(d);
        setError(null);
      })
      .catch((e: unknown) => {
        if (axios.isAxiosError(e) && e.response?.status === 403) {
          navigate(memberPortalRoutes.wellness, { replace: true });
          return;
        }
        setError('No se pudo cargar el panel de métricas.');
      });
  }, [user, navigate]);

  const salesChartData = useMemo(
    () =>
      (data?.sales_last_30d ?? []).map((r) => ({
        ...r,
        label: shortDate(r.date),
      })),
    [data?.sales_last_30d],
  );

  const accessChartData = useMemo(
    () =>
      (data?.access_last_14d ?? []).map((r) => ({
        ...r,
        label: shortDate(r.date),
      })),
    [data?.access_last_14d],
  );

  const totalSales30d = useMemo(
    () => salesChartData.reduce((s, r) => s + r.revenue, 0),
    [salesChartData],
  );

  if (loading || !user) {
    return (
      <div className="mm-page">
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="mm-page mm-dashboard-page">
      <header className="mm-page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            Resumen de negocio con datos en vivo del club.
            {data?.generated_at ? (
              <>
                {' '}
                Actualizado:{' '}
                {new Date(data.generated_at).toLocaleString('es-ES', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </>
            ) : null}
          </p>
        </div>
      </header>

      {error ? <p className="login-error">{error}</p> : null}

      {data ? (
        <>
          <section className="mm-dashboard-kpis">
            <div className="members-panel mm-dashboard-kpi">
              <p className="muted mm-dashboard-kpi-label">Socios</p>
              <p className="mm-dashboard-kpi-value">{data.summary.members}</p>
              <p className="muted mm-dashboard-kpi-hint">
                Activos (flag): {data.summary.active_members}
              </p>
            </div>
            <div className="members-panel mm-dashboard-kpi">
              <p className="muted mm-dashboard-kpi-label">Staff</p>
              <p className="mm-dashboard-kpi-value">{data.summary.staff}</p>
            </div>
            <div className="members-panel mm-dashboard-kpi">
              <p className="muted mm-dashboard-kpi-label">Ventas POS (30 d.)</p>
              <p className="mm-dashboard-kpi-value">{formatMoney(totalSales30d)}</p>
            </div>
            <div className="members-panel mm-dashboard-kpi">
              <p className="muted mm-dashboard-kpi-label">Deuda membresías</p>
              <p className="mm-dashboard-kpi-value">
                {formatMoney(data.membership_debt.total_owed)}
              </p>
              <p className="muted mm-dashboard-kpi-hint">
                {data.membership_debt.pending_invoices} registro(s) con saldo
              </p>
            </div>
          </section>

          <section className="members-panel members-panel--pad mm-dashboard-catalog">
            <h2 className="mm-dashboard-section-title">Catálogo y operaciones</h2>
            <ul className="mm-dashboard-catalog-grid">
              <li>
                <span className="muted">Planes de membresía</span>
                <strong>{data.summary.membership_plans}</strong>
              </li>
              <li>
                <span className="muted">Productos POS</span>
                <strong>{data.summary.catalog_products}</strong>
              </li>
              <li>
                <span className="muted">Ejercicios</span>
                <strong>{data.summary.exercises}</strong>
              </li>
              <li>
                <span className="muted">Rutinas</span>
                <strong>{data.summary.training_routines}</strong>
              </li>
              <li>
                <span className="muted">Planes nutrición</span>
                <strong>{data.summary.nutrition_plans}</strong>
              </li>
            </ul>
          </section>

          <div className="mm-dashboard-charts">
            <section className="members-panel members-panel--pad mm-dashboard-chart-card">
              <h2 className="mm-dashboard-section-title">Ventas POS por día</h2>
              <p className="muted mm-dashboard-chart-sub">
                Ingresos registrados en punto de venta (últimos 30 días).
              </p>
              <div className="mm-dashboard-chart-wrap">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={salesChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      interval={4}
                    />
                    <YAxis
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        color: 'var(--text)',
                      }}
                      formatter={(value) => {
                        const n = typeof value === 'number' ? value : Number(value);
                        return [formatMoney(Number.isFinite(n) ? n : 0), 'Ingresos'];
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      name="revenue"
                      fill="var(--accent)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="members-panel members-panel--pad mm-dashboard-chart-card">
              <h2 className="mm-dashboard-section-title">Accesos al club</h2>
              <p className="muted mm-dashboard-chart-sub">
                Validaciones en recepción: permitidos vs. resto (últimos 14 días).
              </p>
              <div className="mm-dashboard-chart-wrap">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={accessChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        color: 'var(--text)',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="allowed"
                      name="Permitidos"
                      stackId="1"
                      stroke="#16a34a"
                      fill="#16a34a"
                      fillOpacity={0.35}
                    />
                    <Area
                      type="monotone"
                      dataKey="denied"
                      name="No permitido / otros"
                      stackId="1"
                      stroke="#ca8a04"
                      fill="#ca8a04"
                      fillOpacity={0.35}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="muted mm-dashboard-foot">
                Más detalle en{' '}
                <Link to={routes.controlAccesoRegistro}>Registro de accesos</Link> y{' '}
                <Link to={routes.puntoVentaVentas}>Ventas POS</Link>.
              </p>
            </section>
          </div>
        </>
      ) : !error ? (
        <p className="muted">Cargando métricas…</p>
      ) : null}
    </div>
  );
}
