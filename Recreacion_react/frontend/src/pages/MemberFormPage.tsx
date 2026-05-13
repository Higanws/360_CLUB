import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { routes } from '../config/member-management';
import { memberPortalRoutes } from '../config/member-portal';
import { api } from '../lib/api';
import { extractApiMessage } from '../lib/extract-api-message';
import type { GenderValue } from '../lib/gender-options';
import { normalizeStoredGender } from '../lib/gender-options';
import { useAuth } from '../context/AuthContext';

type FormOptions = {
  staff: { id: number; label: string }[];
  classes: { id: number; class_name: string | null }[];
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
  assign_class_ids: number[];
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
  const [classPick, setClassPick] = useState<Record<number, boolean>>({});
  const [physical_weight_kg, setPhysicalWeight] = useState('');
  const [physical_height_cm, setPhysicalHeight] = useState('');
  const [physical_chest_cm, setPhysicalChest] = useState('');
  const [physical_waist_cm, setPhysicalWaist] = useState('');
  const [physical_thigh_cm, setPhysicalThigh] = useState('');
  const [physical_arms_cm, setPhysicalArms] = useState('');
  const [physical_fat_percent, setPhysicalFat] = useState('');

  const isEdit = mode === 'edit';

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
        setFrom(m.membership_valid_from ?? '');
        setTo(m.membership_valid_to ?? '');
        setPlan(m.selected_membership ?? '');
        setStaff(
          m.assign_staff_mem != null ? String(m.assign_staff_mem) : '',
        );
        setActivated(m.activated === 1);
        const picks: Record<number, boolean> = {};
        for (const cid of m.assign_class_ids ?? []) {
          picks[cid] = true;
        }
        setClassPick(picks);
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

  useEffect(() => {
    if (!options?.classes.length) return;
    setClassPick((prev) => {
      const next = { ...prev };
      for (const c of options.classes) {
        if (next[c.id] === undefined) next[c.id] = false;
      }
      return next;
    });
  }, [options]);

  const assign_class_ids = useMemo(() => {
    return Object.entries(classPick)
      .filter(([, v]) => v)
      .map(([k]) => parseInt(k, 10));
  }, [classPick]);

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
        assign_class_ids,
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
                <select
                  value={di_dni_type}
                  onChange={(e) =>
                    setDniType(e.target.value as 'DI' | 'DNI')
                  }
                >
                  <option value="DNI">DNI</option>
                  <option value="DI">DI</option>
                </select>
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
              <select
                required
                value={gender}
                onChange={(e) =>
                  setGender(e.target.value as GenderValue | '')
                }
              >
                <option value="" disabled>
                  Seleccionar…
                </option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
              </select>
            </label>
            <label>
              Fecha de nacimiento
              <input
                type="date"
                value={birth_date}
                onChange={(e) => setBirth(e.target.value)}
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
              <input
                type="date"
                value={membership_valid_from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label>
              Vigencia hasta
              <input
                type="date"
                value={membership_valid_to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
            <label className="member-form-span2">
              Plan de membresía
              <select
                value={selected_membership}
                onChange={(e) => setPlan(e.target.value)}
              >
                <option value="">— Ninguno —</option>
                {(options?.memberships ?? []).map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.membership_label ?? `Plan ${p.id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="member-form-span2">
              Entrenador / staff asignado
              <select
                value={assign_staff_mem}
                onChange={(e) => setStaff(e.target.value)}
              >
                <option value="">— Ninguno —</option>
                {(options?.staff ?? []).map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.label || `Staff ${s.id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="member-form-check">
              <input
                type="checkbox"
                checked={activated}
                onChange={(e) => setActivated(e.target.checked)}
              />
              Cuenta activada (puede iniciar sesión como socio)
            </label>
          </div>
        </section>

        <section className="home-card member-form-section">
          <h2 className="member-detail-h2">Clases</h2>
          <div className="member-form-classes">
            {(options?.classes ?? []).length === 0 ? (
              <p className="muted">No hay clases definidas en el sistema.</p>
            ) : (
              (options?.classes ?? []).map((c) => (
                <label key={c.id} className="member-form-check">
                  <input
                    type="checkbox"
                    checked={!!classPick[c.id]}
                    onChange={(e) =>
                      setClassPick((p) => ({
                        ...p,
                        [c.id]: e.target.checked,
                      }))
                    }
                  />
                  {c.class_name ?? `Clase ${c.id}`}
                </label>
              ))
            )}
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
