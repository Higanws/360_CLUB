import axios from 'axios';
import { type FormEvent, useEffect, useState } from 'react';
import { MmTableActions } from '../components/mm/MmTableActions';
import { PageLoading } from '../components/mm/PageLoading';
import { useGestionAuth } from '../hooks/useGestionAuth';
import { api } from '../lib/api';
import { extractApiMessage } from '../lib/extract-api-message';
import { currencyFieldLabel, formatMoney } from '../lib/format-money';

type Product = {
  id: number;
  sku: string | null;
  name: string;
  unit_price: number;
  stock_qty: number;
  active: number;
};

export function PosStockPage() {
  useGestionAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('0');
  const [savingNew, setSavingNew] = useState(false);

  const [stockDraft, setStockDraft] = useState<Record<number, string>>({});

  const [initialLoad, setInitialLoad] = useState(true);

  function load() {
    api
      .get<{ products: Product[] }>('/pos/products')
      .then(({ data }) => {
        setProducts(data.products);
        setStockDraft(
          Object.fromEntries(data.products.map((p) => [p.id, String(p.stock_qty)])),
        );
      })
      .catch(() => setError('No se pudo cargar el inventario.'))
      .finally(() => setInitialLoad(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    const price = parseFloat(newPrice.replace(',', '.'));
    const stock = parseInt(newStock, 10);
    if (!newName.trim()) {
      setError('Indica el nombre del producto.');
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      setError('Precio no válido.');
      return;
    }
    if (Number.isNaN(stock) || stock < 0) {
      setError('Stock inicial no válido.');
      return;
    }
    setSavingNew(true);
    try {
      await api.post('/pos/products', {
        name: newName.trim(),
        sku: newSku.trim() || undefined,
        unit_price: price,
        stock_qty: stock,
      });
      setNewName('');
      setNewSku('');
      setNewPrice('');
      setNewStock('0');
      setMsg('Producto creado.');
      load();
    } catch (err: unknown) {
      setError(extractApiMessage(err) || 'No se pudo crear el producto.');
    } finally {
      setSavingNew(false);
    }
  }

  async function saveStock(id: number) {
    setMsg(null);
    setError(null);
    const raw = stockDraft[id] ?? '0';
    const q = parseInt(raw, 10);
    if (Number.isNaN(q) || q < 0) {
      setError('Cantidad de stock no válida.');
      return;
    }
    try {
      await api.patch(`/pos/products/${id}/stock`, { stock_qty: q });
      setMsg('Stock actualizado.');
      load();
    } catch (err: unknown) {
      setError(extractApiMessage(err) || 'No se pudo actualizar el stock.');
    }
  }

  async function toggleActive(p: Product) {
    setError(null);
    setMsg(null);
    try {
      await api.patch(`/pos/products/${p.id}`, {
        active: p.active === 1 ? 0 : 1,
      });
      load();
    } catch (err: unknown) {
      setError(extractApiMessage(err) || 'No se pudo cambiar el estado.');
    }
  }

  async function removeProduct(id: number) {
    if (
      !confirm(
        '¿Eliminar este producto? Si tiene ventas previas solo se desactivará.',
      )
    ) {
      return;
    }
    setError(null);
    setMsg(null);
    try {
      const res = await api.delete<{ deactivated?: boolean }>(
        `/pos/products/${id}`,
      );
      setMsg(
        res.data?.deactivated
          ? 'Producto desactivado (tiene ventas registradas).'
          : 'Producto eliminado.',
      );
      load();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        const m = err.response.data.message;
        setError(Array.isArray(m) ? m.join(' ') : String(m));
        return;
      }
      setError('No se pudo eliminar el producto.');
    }
  }

  if (initialLoad && products.length === 0) {
    return <PageLoading message="Cargando inventario…" />;
  }

  return (
    <div className="mm-page pos-page">
      <header className="mm-page-head">
        <div>
          <h1>Control de stock</h1>
          <p className="muted">
            <span className="members-breadcrumb">Venta y Stock</span>
          </p>
        </div>
      </header>

      {error ? <p className="login-error">{error}</p> : null}
      {msg ? <p className="muted">{msg}</p> : null}

      <section className="pos-stock-panel">
        <h2 className="pos-stock-panel__title">Nuevo producto</h2>
        <div className="pos-stock-panel__body">
          <form className="pos-stock-form" onSubmit={(e) => void onCreate(e)}>
          <label>
            Nombre *
            <input
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={200}
            />
          </label>
          <label>
            SKU
            <input
              value={newSku}
              onChange={(e) => setNewSku(e.target.value)}
              maxLength={64}
            />
          </label>
          <label>
            {currencyFieldLabel('Precio')} *
            <input
              required
              inputMode="decimal"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
          </label>
          <label>
            Stock inicial
            <input
              inputMode="numeric"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={savingNew}>
            {savingNew ? 'Guardando…' : 'Añadir producto'}
          </button>
        </form>
        </div>
      </section>

      <section className="pos-stock-panel">
        <h2 className="pos-stock-panel__title">Inventario</h2>
        <div className="pos-stock-panel__body pos-stock-panel__body--table">
          <div className="members-table-wrap pos-stock-inventory-table">
            <table className="members-table pos-stock-table">
              <colgroup>
                <col className="pos-stock-col pos-stock-col--sku" />
                <col className="pos-stock-col pos-stock-col--name" />
                <col className="pos-stock-col pos-stock-col--price" />
                <col className="pos-stock-col pos-stock-col--stock" />
                <col className="pos-stock-col pos-stock-col--status" />
                <col className="pos-stock-col pos-stock-col--actions" />
              </colgroup>
              <thead>
                <tr>
                <th>SKU</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="pos-stock-empty-row">
                    <span className="muted">No hay productos todavía.</span>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.sku ?? '—'}</td>
                    <td>{p.name}</td>
                    <td>{formatMoney(p.unit_price)}</td>
                    <td className="pos-stock-table__stock">
                      <div className="pos-stock-cell">
                        <input
                          className="pos-stock-input"
                          type="number"
                          min={0}
                          aria-label={`Stock de ${p.name}`}
                          value={stockDraft[p.id] ?? String(p.stock_qty)}
                          onChange={(e) =>
                            setStockDraft((d) => ({
                              ...d,
                              [p.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="btn-outline pos-stock-save"
                          onClick={() => void saveStock(p.id)}
                        >
                          Guardar
                        </button>
                      </div>
                    </td>
                    <td className="pos-stock-table__status">
                      {p.active === 1 ? (
                        <span className="member-status member-status--ok">
                          Activo
                        </span>
                      ) : (
                        <span className="member-status member-status--danger">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <MmTableActions label={`Acciones de ${p.name}`}>
                      <button
                        type="button"
                        className="btn-table btn-table--link"
                        onClick={() => void toggleActive(p)}
                      >
                        {p.active === 1 ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        className="btn-table btn-table--danger"
                        onClick={() => void removeProduct(p.id)}
                      >
                        Eliminar
                      </button>
                    </MmTableActions>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
      </section>
    </div>
  );
}
