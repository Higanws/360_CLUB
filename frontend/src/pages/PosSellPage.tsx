import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { memberPortalRoutes } from '../config/member-portal';
import { api } from '../lib/api';
import { extractApiMessage } from '../lib/extract-api-message';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../lib/format-money';
import { POS_PAYMENT_OPTIONS } from '../lib/pos-payment';

type Product = {
  id: number;
  sku: string | null;
  name: string;
  unit_price: number;
  stock_qty: number;
  active: number;
};

type CartLine = { product: Product; qty: number };

export function PosSellPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const r = user.role_name?.trim().toLowerCase() ?? '';
    if (r === 'member') navigate(memberPortalRoutes.wellness, { replace: true });
  }, [user, navigate]);

  function loadCatalog() {
    api
      .get<{ products: Product[] }>('/pos/catalog')
      .then(({ data }) => setCatalog(data.products))
      .catch(() => setError('No se pudo cargar el catálogo.'));
  }

  useEffect(() => {
    if (!user) return;
    loadCatalog();
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q),
    );
  }, [catalog, search]);

  function addToCart(p: Product) {
    if (p.stock_qty <= 0) return;
    setCart((prev) => {
      const i = prev.findIndex((l) => l.product.id === p.id);
      if (i >= 0) {
        const line = prev[i]!;
        const maxAdd = p.stock_qty - line.qty;
        if (maxAdd <= 0) return prev;
        const next = [...prev];
        next[i] = { ...line, qty: line.qty + 1 };
        return next;
      }
      return [...prev, { product: p, qty: 1 }];
    });
  }

  function setQty(productId: number, qty: number) {
    setCart((prev) => {
      const line = prev.find((l) => l.product.id === productId);
      if (!line) return prev;
      const max = line.product.stock_qty;
      const q = Math.max(0, Math.min(max, qty));
      if (q === 0) return prev.filter((l) => l.product.id !== productId);
      return prev.map((l) =>
        l.product.id === productId ? { ...l, qty: q } : l,
      );
    });
  }

  function removeLine(productId: number) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  }

  const total = useMemo(
    () =>
      cart.reduce(
        (s, l) => s + Number(l.product.unit_price) * l.qty,
        0,
      ),
    [cart],
  );

  async function checkout() {
    if (cart.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      await api.post('/pos/sales', {
        payment_method: paymentMethod,
        lines: cart.map((l) => ({
          product_id: l.product.id,
          qty: l.qty,
        })),
      });
      setCart([]);
      loadCatalog();
    } catch (e: unknown) {
      setError(extractApiMessage(e) || 'No se pudo completar la venta.');
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

  return (
    <div className="mm-page pos-page">
      <header className="mm-page-head">
        <div>
          <h1>Vender un producto</h1>
          <p className="muted">
            <span className="members-breadcrumb">Venta y Stock</span>
          </p>
        </div>
      </header>

      {error ? <p className="login-error">{error}</p> : null}

      <div className="pos-layout">
        <section className="pos-panel pos-panel--catalog">
          <div className="pay-toolbar">
            <span className="muted">Catálogo</span>
            <label className="pay-search">
              <span>Buscar:</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre o SKU"
              />
            </label>
          </div>
          <div className="pos-catalog-grid">
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                className="pos-catalog-card"
                disabled={p.stock_qty <= 0}
                onClick={() => addToCart(p)}
              >
                <span className="pos-catalog-name">{p.name}</span>
                <span className="pos-catalog-meta">
                  {formatMoney(p.unit_price)} · Stock {p.stock_qty}
                </span>
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <p className="muted pos-empty-hint">
              No hay productos activos. Cárguelos en control de stock.
            </p>
          ) : null}
        </section>

        <section className="pos-panel pos-panel--ticket">
          <h2 className="pos-ticket-title">Ticket</h2>
          <ul className="pos-ticket-lines">
            {cart.map((l) => (
              <li key={l.product.id} className="pos-ticket-line">
                <div className="pos-ticket-line-info">
                  <span className="pos-ticket-line-name">{l.product.name}</span>
                  <span className="muted">
                    {formatMoney(l.product.unit_price)} ×{' '}
                    <input
                      className="pos-qty-input"
                      type="number"
                      min={1}
                      max={l.product.stock_qty}
                      value={l.qty}
                      onChange={(e) =>
                        setQty(l.product.id, parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </span>
                </div>
                <div className="pos-ticket-line-actions">
                  <span className="pos-ticket-line-sub">
                    {formatMoney(l.product.unit_price * l.qty)}
                  </span>
                  <button
                    type="button"
                    className="btn-table btn-table--danger"
                    onClick={() => removeLine(l.product.id)}
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="pos-ticket-total">
            <span>Total</span>
            <strong>{formatMoney(total)}</strong>
          </div>
          <label className="pos-payment-field">
            <span className="muted">Método de pago</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {POS_PAYMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn-primary pos-checkout-btn"
            disabled={busy || cart.length === 0}
            onClick={() => void checkout()}
          >
            {busy ? 'Procesando…' : 'Cobrar'}
          </button>
        </section>
      </div>
    </div>
  );
}
