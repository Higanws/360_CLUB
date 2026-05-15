import { type FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { routes } from '../config/member-management';
import { api } from '../lib/api';
import { extractApiMessage } from '../lib/extract-api-message';
import { currencySymbol } from '../lib/format-money';
import { useAuth } from '../context/AuthContext';

type Mode = 'create' | 'edit';

export function MembershipPlanFormPage({ mode }: { mode: Mode }) {
  const { id: idParam } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(mode === 'edit');

  const [label, setLabel] = useState('');
  const [periodDays, setPeriodDays] = useState('');
  const [installmentPlan, setInstallmentPlan] = useState('');
  const [amount, setAmount] = useState('');
  const [signupFee, setSignupFee] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  const isAdmin =
    user?.role_name?.trim().toLowerCase() === 'administrator';

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user || !isAdmin || mode !== 'edit' || !idParam) return;
    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) {
      setLoadingPlan(false);
      setError('Identificador no válido.');
      return;
    }
    setLoadingPlan(true);
    api
      .get<{
        id: number;
        membership_label: string | null;
        membership_amount: number | null;
        membership_period_days: number | null;
        installment_plan: string | null;
        signup_fee: number | null;
        description: string | null;
        image: string | null;
      }>(`/memberships/${id}`)
      .then((res) => {
        const p = res.data;
        setLabel(p.membership_label ?? '');
        setPeriodDays(
          p.membership_period_days != null ? String(p.membership_period_days) : '',
        );
        setInstallmentPlan(p.installment_plan ?? '');
        setAmount(
          p.membership_amount != null ? String(p.membership_amount) : '',
        );
        setSignupFee(p.signup_fee != null ? String(p.signup_fee) : '');
        setDescription(p.description ?? '');
        setImage(p.image ?? '');
        setError(null);
      })
      .catch(() => setError('No se pudo cargar la membresía.'))
      .finally(() => setLoadingPlan(false));
  }, [mode, idParam, user, isAdmin]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const labelTrim = label.trim();
    if (!labelTrim) {
      setError('Indica el nombre de la membresía.');
      return;
    }
    const amt = parseFloat(amount.replace(',', '.'));
    if (Number.isNaN(amt) || amt < 0) {
      setError('Indica un importe de membresía válido.');
      return;
    }
    let period: number | undefined;
    if (periodDays.trim()) {
      const p = parseInt(periodDays, 10);
      if (Number.isNaN(p) || p < 1) {
        setError('El periodo debe ser un número de días válido.');
        return;
      }
      period = p;
    }
    let fee: number | undefined;
    if (signupFee.trim()) {
      const f = parseFloat(signupFee.replace(',', '.'));
      if (Number.isNaN(f) || f < 0) {
        setError('La tarifa de registro no es válida.');
        return;
      }
      fee = f;
    }

    const body: Record<string, unknown> = {
      membership_label: labelTrim,
      membership_amount: amt,
      membership_period_days: period,
      installment_plan: installmentPlan.trim() || undefined,
      signup_fee: fee,
      description: description.trim() || undefined,
      image: image.trim() || undefined,
    };

    setSaving(true);
    try {
      if (mode === 'create') {
        await api.post('/memberships', body);
      } else {
        const id = parseInt(idParam ?? '', 10);
        if (Number.isNaN(id)) {
          setError('Identificador no válido.');
          return;
        }
        await api.patch(`/memberships/${id}`, body);
      }
      navigate(routes.membresias, { replace: true });
    } catch (err: unknown) {
      setError(extractApiMessage(err) || 'No se pudo guardar.');
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

  if (!isAdmin) {
    return <Navigate to={routes.membresias} replace />;
  }

  if (mode === 'edit' && loadingPlan) {
    return (
      <div className="mm-page">
        <p className="muted">Cargando membresía…</p>
      </div>
    );
  }

  const title =
    mode === 'create' ? 'Añadir membresía' : 'Editar membresía';

  return (
    <div className="mm-page pay-manual-page">
      <header className="pay-manual-head">
        <div className="pay-manual-title-row">
          <h1>{title}</h1>
          <span className="muted pay-manual-crumb">Afiliación</span>
        </div>
        <Link
          to={routes.membresias}
          className="btn-outline pay-manual-list-btn"
        >
          <span aria-hidden>☰</span> Lista de membresías
        </Link>
      </header>

      {error ? <p className="login-error">{error}</p> : null}

      <form className="pay-manual-form" onSubmit={(e) => void onSubmit(e)}>
        <div className="pay-manual-fields">
          <label className="pay-manual-row">
            <span className="pay-manual-label">
              Nombre de membresía <span className="pay-req">*</span>
            </span>
            <input
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej. Gold Membership"
              maxLength={100}
            />
          </label>

          <label className="pay-manual-row">
            <span className="pay-manual-label">
              Periodo de membresía <span className="pay-req">*</span>
            </span>
            <input
              inputMode="numeric"
              required
              value={periodDays}
              onChange={(e) => setPeriodDays(e.target.value)}
              placeholder="Número de días"
            />
          </label>

          <label className="pay-manual-row">
            <span className="pay-manual-label">
              Plan de instalación <span className="pay-req">*</span>
            </span>
            <input
              required
              value={installmentPlan}
              onChange={(e) => setInstallmentPlan(e.target.value)}
              placeholder="Ej. 1 mes, 1 semana"
              maxLength={100}
            />
          </label>

          <label className="pay-manual-row">
            <span className="pay-manual-label">
              Cantidad de membresía <span className="pay-req">*</span>
            </span>
            <span className="pay-manual-input-wrap">
              <span className="pay-currency">{currencySymbol()}</span>
              <input
                inputMode="decimal"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </span>
          </label>

          <label className="pay-manual-row">
            <span className="pay-manual-label">
              Tarifa de registro <span className="pay-req">*</span>
            </span>
            <span className="pay-manual-input-wrap">
              <span className="pay-currency">{currencySymbol()}</span>
              <input
                inputMode="decimal"
                required
                value={signupFee}
                onChange={(e) => setSignupFee(e.target.value)}
                placeholder="0"
              />
            </span>
          </label>

          <label className="pay-manual-row">
            <span className="pay-manual-label">Descripción</span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              maxLength={8000}
              style={{
                width: '100%',
                maxWidth: '360px',
                padding: '0.55rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-page)',
                color: 'var(--text)',
                resize: 'vertical',
              }}
            />
          </label>

          <label className="pay-manual-row">
            <span className="pay-manual-label">Imagen (archivo subido)</span>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="Nombre de archivo en el servidor de medios"
              maxLength={200}
            />
          </label>
        </div>

        <div className="pay-manual-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar membresía'}
          </button>
        </div>
      </form>
    </div>
  );
}
