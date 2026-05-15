import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../config/member-management';
import { memberPortalRoutes } from '../config/member-portal';
import { api } from '../lib/api';
import { extractApiMessage } from '../lib/extract-api-message';
import { currencySymbol } from '../lib/format-money';
import { useAuth } from '../context/AuthContext';

type Options = {
  members: { id: number; label: string }[];
  memberships: {
    id: number;
    label: string | null;
    amount: number | null;
  }[];
};

export function ManualMembershipPaymentPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [options, setOptions] = useState<Options | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [memberId, setMemberId] = useState('');
  const [membershipId, setMembershipId] = useState('');
  const [totalInput, setTotalInput] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const r = user.role_name?.trim().toLowerCase() ?? '';
    if (r === 'member') navigate(memberPortalRoutes.wellness, { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    api
      .get<Options>('/payments/membership/form-options')
      .then(({ data }) => setOptions(data))
      .catch((e) =>
        setError(extractApiMessage(e) || 'No se pudieron cargar las opciones.'),
      );
  }, [user]);

  useEffect(() => {
    if (!membershipId || !options) return;
    const id = parseInt(membershipId, 10);
    const plan = options.memberships.find((p) => p.id === id);
    if (plan?.amount != null) setTotalInput(String(plan.amount));
    else setTotalInput('');
  }, [membershipId, options]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const mid = parseInt(memberId, 10);
    const planId = parseInt(membershipId, 10);
    const paid = parseFloat(paidAmount.replace(',', '.'));
    const total = parseFloat(totalInput.replace(',', '.'));
    if (!memberId || Number.isNaN(mid)) {
      setError('Selecciona un miembro.');
      return;
    }
    if (!membershipId || Number.isNaN(planId)) {
      setError('Selecciona una membresía.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Indica las fechas de vigencia.');
      return;
    }
    if (Number.isNaN(paid) || paid < 0) {
      setError('Indica un importe de cobro válido.');
      return;
    }
    if (Number.isNaN(total) || total < 0) {
      setError('Indica la cantidad total de la membresía.');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        member_id: mid,
        membership_id: planId,
        membership_amount: total,
        paid_amount: paid,
        start_date: startDate,
        end_date: endDate,
      };
      await api.post('/payments/membership/manual', body);
      navigate(routes.cobroMembresias, { replace: true });
    } catch (err: unknown) {
      setError(extractApiMessage(err) || 'No se pudo registrar el cobro.');
    } finally {
      setSaving(false);
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
    <div className="mm-page pay-manual-page">
      <header className="pay-manual-head">
        <div className="pay-manual-title-row">
          <h1>
            <span className="pay-manual-plus" aria-hidden>
              +
            </span>{' '}
            Registrar cobro manual
          </h1>
          <span className="muted pay-manual-crumb">Cobro</span>
        </div>
        <Link to={routes.cobroMembresias} className="btn-outline pay-manual-list-btn">
          <span aria-hidden>☰</span> Lista de cobro de membresías
        </Link>
      </header>

      {error ? <p className="login-error">{error}</p> : null}

      <form className="pay-manual-form" onSubmit={(e) => void onSubmit(e)}>
        <div className="pay-manual-fields">
          <label className="pay-manual-row">
            <span className="pay-manual-label">
              Miembro <span className="pay-req">*</span>
            </span>
            <select
              required
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            >
              <option value="">Seleccione miembro</option>
              {(options?.members ?? []).map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.label || `Socio ${m.id}`}
                </option>
              ))}
            </select>
          </label>

          <label className="pay-manual-row">
            <span className="pay-manual-label">
              Afiliación <span className="pay-req">*</span>
            </span>
            <select
              required
              value={membershipId}
              onChange={(e) => setMembershipId(e.target.value)}
            >
              <option value="">Seleccione membresía</option>
              {(options?.memberships ?? []).map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.label ?? `Plan ${p.id}`}
                </option>
              ))}
            </select>
          </label>

          <label className="pay-manual-row">
            <span className="pay-manual-label">
              Cantidad total <span className="pay-req">*</span>
            </span>
            <span className="pay-manual-input-wrap">
              <span className="pay-currency">{currencySymbol()}</span>
              <input
                inputMode="decimal"
                required
                className="pay-manual-total"
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value)}
                placeholder="0"
              />
            </span>
          </label>

          <label className="pay-manual-row">
            <span className="pay-manual-label">
              Importe del cobro <span className="pay-req">*</span>
            </span>
            <span className="pay-manual-input-wrap">
              <span className="pay-currency">{currencySymbol()}</span>
              <input
                inputMode="decimal"
                required
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0"
              />
            </span>
          </label>

          <div className="pay-manual-row pay-manual-row--dates">
            <span className="pay-manual-label">
              Membresía válida <span className="pay-req">*</span>
            </span>
            <div className="pay-manual-date-range">
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="pay-manual-a">a</span>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="pay-manual-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Registrar cobro manual'}
          </button>
        </div>
      </form>
    </div>
  );
}
