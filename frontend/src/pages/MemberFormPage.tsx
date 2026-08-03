import { useEffect, useMemo, useState } from 'react';
import { bindDateRange, normalizeDateRange } from '../lib/date-range';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MmDatePicker } from '../components/ui/MmDatePicker';
import { MmSelect } from '../components/ui/MmSelect';
import { routes } from '../config/member-management';
import { memberPortalRoutes } from '../config/member-portal';
import { api } from '../lib/api';
import { extractApiMessage } from '../lib/extract-api-message';
import type { GenderValue } from '../lib/gender-options';
import { normalizeStoredGender } from '../lib/gender-options';
import { useAuth } from '../context/AuthContext';

type FormOptions = {
  staff: { id: number; label: string }[];
  memberships: {
    id: number;
    membership_label: string | null;
    amount: number | null;
  }[];
};

type MemberPayload = {
  id: number;
  activated: number | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  email: string | null;
  mobile: string | null;
  phone: string | null;
  gender: string | null;
  birth_date: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  di_dni_type: string | null;
  di_dni_number: string | null;
  membership_valid_from: string | null;
  membership_valid_to: string | null;
  selected_membership: string | null;
  assign_staff_mem: number | null;
  subscribe_nutrition_general?: number | boolean;
  subscribe_training_general?: number | boolean;
  physical_weight_kg: number | null;
  physical_height_cm: number | null;
  physical_chest_cm: number | null;
  physical_waist_cm: number | null;
  physical_thigh_cm: number | null;
  physical_arms_cm: number | null;
  physical_fat_percent: number | null;
};

type Mode = 'create' | 'edit';

export function MemberFormPage({ mode }: { mode: Mode }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [options, setOptions] = useState<FormOptions | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [first_name, setFirst] = useState('');
  const [last_name, setLast] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<GenderValue | ''>('');
  const [birth_date, setBirth] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipcode, setZip] = useState('');
  const [di_dni_type, setDniType] = useState<'DI' | 'DNI'>('DNI');
  const [di_dni_number, setDniNum] = useState('');
  const [membership_valid_from, setFrom] = useState('');
  const [membership_valid_to, setTo] = useState('');
  const [selected_membership, setPlan] = useState('');
  const [assign_staff_mem, setStaff] = useState('');
  const [activated, setActivated] = useState(true);
  const [subscribeNutritionGeneral, setSubscribeNutritionGeneral] =
    useState(true);
  const [subscribeTrainingGeneral, setSubscribeTrainingGeneral] =
    useState(true);
  const [physical_weight_kg, setPhysicalWeight] = useState('');
  const [physical_height_cm, setPhysicalHeight] = useState('');
  const [physical_chest_cm, setPhysicalChest] = useState('');
  const [physical_waist_cm, setPhysicalWaist] = useState('');
  const [physical_thigh_cm, setPhysicalThigh] = useState('');
  const [physical_arms_cm, setPhysicalArms] = useState('');
  const [physical_fat_percent, setPhysicalFat] = useState('');

  const isEdit = mode === 'edit';

  const membershipRange = useMemo(
    () =>
      bindDateRange(
        membership_valid_from,
        membership_valid_to,
        setFrom,
        setTo,
      ),
    [membership_valid_from, membership_valid_to],
  );

  function optPhysicalNum(s: string): number | undefined {
    const t = s.trim();
    if (!t) return undefined;
    const n = parseFloat(t.replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
  }

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const r = user.role_name?.trim().toLowerCase() ?? '';
    if (r === 'member') {
      navigate(memberPortalRoutes.wellness, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    api
      .get<FormOptions>('/members/form-options')
      .then(({ data }) => setOptions(data))
      .catch(() => setError('No se pudieron cargar las opciones del formulario.'));
  }, [user]);

  useEffect(() => {
    if (!isEdit || !id || !user) return;
    api
      .get<{ member: MemberPayload }>(`/members/${id}`)
      .then(({ data }) => {
        const m = data.member;
        setFirst(m.first_name ?? '');
        setLast(m.last_name ?? '');
        setUsername(m.username ?? '');
        setEmail(m.email ?? '');
        setMobile(m.mobile ?? '');
        setPhone(m.phone ?? '');
        setGender(normalizeStoredGender(m.gender) || '');
        setBirth(m.birth_date ?? '');
        setAddress(m.address ?? '');
        setCity(m.city ?? '');
        setState(m.state ?? '');
        setZip(m.zipcode ?? '');
        setDniType((m.di_dni_type === 'DI' ? 'DI' : 'DNI') as 'DI' | 'DNI');
        setDniNum(m.di_dni_number ?? '');
        const vigencia = normalizeDateRange(
          m.membership_valid_from ?? '',
          m.membership_valid_to ?? '',
        );
        setFrom(vigencia.desde);
        setTo(vigencia.hasta);
        setPlan(m.selected_membership ?? '');
        setStaff(
          m.assign_staff_mem != null ? String(m.assign_staff_mem) : '',
        );
        setActivated(m.activated === 1);
        setSubscribeNutritionGeneral(
          m.subscribe_nutrition_general === undefined ||
            m.subscribe_nutrition_general === 1 ||
            m.subscribe_nutrition_general === true,
        );
        setSubscribeTrainingGeneral(
          m.subscribe_training_general === undefined ||
            m.subscribe_training_general === 1 ||
            m.subscribe_training_general === true,
        );
        setPhysicalWeight(
          m.physical_weight_kg != null ? String(m.physical_weight_kg) : '',
        );
        setPhysicalHeight(
          m.physical_height_cm != null ? String(m.physical_height_cm) : '',
        );
        setPhysicalChest(
          m.physical_chest_cm != null ? String(m.physical_chest_cm) : '',
        );
        setPhysicalWaist(
          m.physical_waist_cm != null ? String(m.physical_waist_cm) : '',
        );
        setPhysicalThigh(
          m.physical_thigh_cm != null ? String(m.physical_thigh_cm) : '',
        );
        setPhysicalArms(
          m.physical_arms_cm != null ? String(m.physical_arms_cm) : '',
        );
        setPhysicalFat(
          m.physical_fat_percent != null ? String(m.physical_fat_percent) : '',
        );
      })
      .catch((e) =>
        setError(extractApiMessage(e) || 'No se pudo cargar el socio.'),
      );
  }, [isEdit, id, user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (!gender) {
        setError('Selecciona el género.');
        setSaving(false);
        return;
      }
      const base = {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        username: username.trim(),
        email: email.trim() || undefined,
        mobile: mobile.trim() || undefined,
        phone: phone.trim() || undefined,
        gender: gender as GenderValue,
        birth_date: birth_date || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zipcode: zipcode.trim() || undefined,
        di_dni_type,
        di_dni_number: di_dni_number.trim(),
        membership_valid_from: membership_valid_from || undefined,
        membership_valid_to: membership_valid_to || undefined,
        selected_membership: selected_membership || undefined,
        assign_staff_mem:
          assign_staff_mem === '' ? undefined : parseInt(assign_staff_mem, 10),
        activated: activated ? 1 : 0,
        subscribe_nutrition_general: subscribeNutritionGeneral,
        subscribe_training_general: subscribeTrainingGeneral,
        physical_weight_kg: optPhysicalNum(physical_weight_kg),
        physical_height_cm: optPhysicalNum(physical_height_cm),
        physical_chest_cm: optPhysicalNum(physical_chest_cm),
        physical_waist_cm: optPhysicalNum(physical_waist_cm),
        physical_thigh_cm: optPhysicalNum(physical_thigh_cm),
        physical_arms_cm: optPhysicalNum(physical_arms_cm),
        physical_fat_percent: optPhysicalNum(physical_fat_percent),
      };

      if (isEdit && id) {
        const patch: Record<string, unknown> = { ...base };
        if (password.trim()) {
          patch.password = password.trim();
        }
        await api.patch(`/members/${id}`, patch);
        navigate(routes.sociosDetail(parseInt(id, 10)), { replace: true });
      } else {
        if (password.trim().length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres.');
          setSaving(false);
          return;
        }
        await api.post('/members', {
          ...base,
          password: password.trim(),
        });
        navigate(routes.socios, { replace: true });
      }
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

  const title = isEdit ? 'Editar socio' : 'Nuevo socio';

  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <h1>{title}</h1>
          <p className="muted">
            Solo personal del club puede crear o modificar socios.
          </p>
        </div>
        <Link to={routes.socios} className="btn-outline">
          Lista
        </Link>
      </header>

      {error ? <p className="login-error">{error}</p> : null}

      <form className="member-form" onSubmit={(e) => void onSubmit(e)}>
        <section className="home-card member-form-section">
          <h2 className="member-detail-h2">Identidad y acceso</h2>
          <div className="member-form-grid">
            <label>
              Nombre
              <input
                value={first_name}
                onChange={(e) => setFirst(e.target.value)}
                required
              />
            </label>
            <label>
              Apellidos
              <input
                value={last_name}
                onChange={(e) => setLast(e.target.value)}
                required
              />
            </label>
            <label>
              Usuario (login)
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                required
              />
            </label>
            <label>
              Contraseña {isEdit ? '(opcional)' : ''}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required={!isEdit}
                placeholder={isEdit ? 'Vacío = sin cambios' : ''}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="member-form-span2">
              Documento (DI o DNI)
              <span className="member-form-inline">
                <MmSelect
                  value={di_dni_type}
                  onValueChange={(v) => setDniType(v as 'DI' | 'DNI')}
                  options={[
                    { value: 'DNI', label: 'DNI' },
                    { value: 'DI', label: 'DI' },
                  ]}
                  className="mm-select-trigger--inline"
                  aria-label="Tipo de documento"
                />
                <input
                  value={di_dni_number}
                  onChange={(e) => setDniNum(e.target.value)}
                  placeholder="Número"
                  required
                />
              </span>
            </label>
          </div>
        </section>

        <section className="home-card member-form-section">
          <h2 className="member-detail-h2">Contacto</h2>
          <div className="member-form-grid">
            <label>
              Móvil
              <input value={mobile} onChange={(e) => setMobile(e.target.value)} />
            </label>
            <label>
              Teléfono
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label>
              Género
              <MmSelect
                required
                value={gender}
                onValueChange={(v) => setGender(v as GenderValue)}
                options={[
                  { value: 'male', label: 'Masculino' },
                  { value: 'female', label: 'Femenino' },
                  { value: 'other', label: 'Otro' },
                ]}
                placeholder="Seleccionar…"
              />
            </label>
            <label>
              Fecha de nacimiento
              <MmDatePicker
                value={birth_date}
                onChange={setBirth}
                aria-label="Fecha de nacimiento"
              />
            </label>
            <label className="member-form-span2">
              Dirección
              <input value={address} onChange={(e) => setAddress(e.target.value)} />
            </label>
            <label>
              Ciudad
              <input value={city} onChange={(e) => setCity(e.target.value)} />
            </label>
            <label>
              Provincia / estado
              <input value={state} onChange={(e) => setState(e.target.value)} />
            </label>
            <label>
              Código postal
              <input value={zipcode} onChange={(e) => setZip(e.target.value)} />
            </label>
          </div>
        </section>

        <section className="home-card member-form-section">
          <h2 className="member-detail-h2">Información física</h2>
          <p className="muted" style={{ marginBottom: '0.75rem' }}>
            Perímetros y composición corporal (pecho, cintura, muslo, brazos,
            % grasa). El resumen está en la lista de socios → Tabla física.
          </p>
          <div className="member-form-grid">
            <label>
              Peso (kg)
              <input
                inputMode="decimal"
                value={physical_weight_kg}
                onChange={(e) => setPhysicalWeight(e.target.value)}
                placeholder="—"
              />
            </label>
            <label>
              Altura (cm)
              <input
                inputMode="decimal"
                value={physical_height_cm}
                onChange={(e) => setPhysicalHeight(e.target.value)}
                placeholder="—"
              />
            </label>
            <label>
              Pecho (cm)
              <input
                inputMode="decimal"
                value={physical_chest_cm}
                onChange={(e) => setPhysicalChest(e.target.value)}
                placeholder="—"
              />
            </label>
            <label>
              Cintura (cm)
              <input
                inputMode="decimal"
                value={physical_waist_cm}
                onChange={(e) => setPhysicalWaist(e.target.value)}
                placeholder="—"
              />
            </label>
            <label>
              Muslo (cm)
              <input
                inputMode="decimal"
                value={physical_thigh_cm}
                onChange={(e) => setPhysicalThigh(e.target.value)}
                placeholder="—"
              />
            </label>
            <label>
              Brazos (cm)
              <input
                inputMode="decimal"
                value={physical_arms_cm}
                onChange={(e) => setPhysicalArms(e.target.value)}
                placeholder="—"
              />
            </label>
            <label>
              % grasa corporal
              <input
                inputMode="decimal"
                value={physical_fat_percent}
                onChange={(e) => setPhysicalFat(e.target.value)}
                placeholder="—"
              />
            </label>
          </div>
        </section>

        <section className="home-card member-form-section">
          <h2 className="member-detail-h2">Membresía</h2>
          <div className="member-form-grid">
            <label>
              Vigencia desde
              <MmDatePicker
                value={membershipRange.desde}
                onChange={membershipRange.onDesdeChange}
                max={membershipRange.maxDesde}
                aria-label="Vigencia de membresía desde"
              />
            </label>
            <label>
              Vigencia hasta
              <MmDatePicker
                value={membershipRange.hasta}
                onChange={membershipRange.onHastaChange}
                min={membershipRange.minHasta}
                aria-label="Vigencia de membresía hasta"
              />
            </label>
            <label className="member-form-span2">
              Plan de membresía
              <MmSelect
                value={selected_membership || '__none__'}
                onValueChange={(v) => setPlan(v === '__none__' ? '' : v)}
                options={[
                  { value: '__none__', label: '— Ninguno —' },
                  ...(options?.memberships ?? []).map((p) => ({
                    value: String(p.id),
                    label: p.membership_label ?? `Plan ${p.id}`,
                  })),
                ]}
              />
            </label>
            <label className="member-form-span2">
              Entrenador / staff asignado
              <MmSelect
                value={assign_staff_mem || '__none__'}
                onValueChange={(v) => setStaff(v === '__none__' ? '' : v)}
                options={[
                  { value: '__none__', label: '— Ninguno —' },
                  ...(options?.staff ?? []).map((s) => ({
                    value: String(s.id),
                    label: s.label || `Staff ${s.id}`,
                  })),
                ]}
              />
            </label>
            <label className="member-form-check">
              <input
                type="checkbox"
                checked={activated}
                onChange={(e) => setActivated(e.target.checked)}
              />
              Cuenta activada (puede iniciar sesión como socio)
            </label>
            <label className="member-form-check">
              <input
                type="checkbox"
                checked={subscribeNutritionGeneral}
                onChange={(e) =>
                  setSubscribeNutritionGeneral(e.target.checked)
                }
              />
              Suscrito a dieta general
            </label>
            <label className="member-form-check">
              <input
                type="checkbox"
                checked={subscribeTrainingGeneral}
                onChange={(e) => setSubscribeTrainingGeneral(e.target.checked)}
              />
              Suscrito a rutina general
            </label>
          </div>
        </section>

        <div className="member-form-actions">
          <Link
            to={
              isEdit && id
                ? routes.sociosDetail(parseInt(id, 10))
                : routes.socios
            }
            className="btn-outline"
          >
            Cancelar
          </Link>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
