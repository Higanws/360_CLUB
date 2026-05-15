import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { extractApiMessage } from '../lib/extract-api-message';
import { routes } from '../config/member-management';
import { normalizeStoredGender } from '../lib/gender-options';
import { useAuth } from '../context/AuthContext';

type FormOptions = {
  club_roles: { id: number; name: string | null }[];
  specializations: { id: number; name: string | null }[];
};

type Mode = 'create' | 'edit';

export function StaffFormPage({ mode }: { mode: Mode }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [options, setOptions] = useState<FormOptions | null>(null);
  const [optError, setOptError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [first_name, setFirst] = useState('');
  const [middle_name, setMiddle] = useState('');
  const [last_name, setLast] = useState('');
  const [gender, setGender] = useState('male');
  const [birth_date, setBirth] = useState('');
  const [role, setRole] = useState('');
  const [specPick, setSpecPick] = useState<Record<number, boolean>>({});
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [mobile, setMobile] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const isAdmin =
    user?.role_name?.trim().toLowerCase() === 'administrator';
  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    api
      .get<FormOptions>('/staff/form-options')
      .then(({ data }) => setOptions(data))
      .catch((e) =>
        setOptError(extractApiMessage(e) || 'No se pudieron cargar las opciones.'),
      );
  }, [user, isAdmin]);

  useEffect(() => {
    if (!isEdit || !id || !user || !isAdmin) return;
    api
      .get<{ staff: Record<string, unknown> }>(`/staff/${id}`)
      .then(({ data }) => {
        const s = data.staff;
        setFirst(String(s.first_name ?? ''));
        setMiddle(String(s.middle_name ?? ''));
        setLast(String(s.last_name ?? ''));
        setGender(normalizeStoredGender(s.gender as string) || 'male');
        setBirth(String(s.birth_date ?? '').slice(0, 10));
        setRole(s.role != null ? String(s.role) : '');
        setAddress(String(s.address ?? ''));
        setCity(String(s.city ?? ''));
        setState(String(s.state ?? ''));
        setZipcode(String(s.zipcode ?? ''));
        setMobile(String(s.mobile ?? ''));
        setPhone(String(s.phone ?? ''));
        setEmail(String(s.email ?? ''));
        setUsername(String(s.username ?? ''));
        const ids = (s.specialization_ids as number[]) ?? [];
        const picks: Record<number, boolean> = {};
        for (const x of ids) picks[x] = true;
        setSpecPick(picks);
      })
      .catch((e) => setError(extractApiMessage(e) || 'No se pudo cargar.'));
  }, [isEdit, id, user, isAdmin]);

  useEffect(() => {
    if (!options?.specializations.length) return;
    setSpecPick((prev) => {
      const n = { ...prev };
      for (const sp of options.specializations) {
        if (n[sp.id] === undefined) n[sp.id] = false;
      }
      return n;
    });
  }, [options]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const specialization_ids = Object.entries(specPick)
      .filter(([, v]) => v)
      .map(([k]) => parseInt(k, 10));
    if (specialization_ids.length === 0) {
      setError('Selecciona al menos una especialización.');
      return;
    }
    setSaving(true);
    try {
      const base = {
        first_name: first_name.trim(),
        middle_name: middle_name.trim() || undefined,
        last_name: last_name.trim(),
        gender,
        birth_date,
        role: parseInt(role, 10),
        specialization_ids,
        address: address.trim(),
        city: city.trim(),
        state: state.trim() || undefined,
        zipcode: zipcode.trim() || undefined,
        mobile: mobile.trim(),
        phone: phone.trim() || undefined,
        email: email.trim(),
      };

      if (isEdit && id) {
        const patch: Record<string, unknown> = { ...base };
        if (password.trim()) patch.password = password.trim();
        await api.patch(`/staff/${id}`, patch);
        navigate(routes.personalDetail(parseInt(id, 10)), { replace: true });
      } else {
        if (password.trim().length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres.');
          setSaving(false);
          return;
        }
        await api.post('/staff', {
          ...base,
          username: username.trim(),
          password: password.trim(),
        });
        navigate(routes.personal, { replace: true });
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

  if (!isAdmin) {
    return <Navigate to={routes.personal} replace />;
  }

  const title = isEdit ? 'Editar miembro del personal' : 'Nuevo miembro del personal';

  return (
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <h1>{title}</h1>
          <p className="muted">Solo administración puede dar de alta o editar personal.</p>
        </div>
      </header>

      {optError ? <p className="login-error">{optError}</p> : null}
      {error ? <p className="login-error">{error}</p> : null}

      <form className="member-form" onSubmit={(e) => void onSubmit(e)}>
        <section className="home-card member-form-section">
          <h2 className="member-detail-h2">Datos personales</h2>
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
              Segundo nombre
              <input
                value={middle_name}
                onChange={(e) => setMiddle(e.target.value)}
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
              Género
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
              >
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
                required
              />
            </label>
            <label>
              Rol en el club
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="">— Seleccionar —</option>
                {(options?.club_roles ?? []).map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name ?? `Rol ${r.id}`}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="home-card member-form-section">
          <h2 className="member-detail-h2">Especialización</h2>
          <div className="member-form-classes">
            {(options?.specializations ?? []).map((sp) => (
              <label key={sp.id} className="member-form-check">
                <input
                  type="checkbox"
                  checked={!!specPick[sp.id]}
                  onChange={(e) =>
                    setSpecPick((p) => ({
                      ...p,
                      [sp.id]: e.target.checked,
                    }))
                  }
                />
                {sp.name ?? `Esp. ${sp.id}`}
              </label>
            ))}
          </div>
        </section>

        <section className="home-card member-form-section">
          <h2 className="member-detail-h2">Contacto</h2>
          <div className="member-form-grid">
            <label className="member-form-span2">
              Dirección
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </label>
            <label>
              Ciudad
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </label>
            <label>
              Provincia
              <input value={state} onChange={(e) => setState(e.target.value)} />
            </label>
            <label>
              Código postal
              <input
                value={zipcode}
                onChange={(e) => setZipcode(e.target.value)}
              />
            </label>
            <label>
              Móvil
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </label>
            <label>
              Teléfono
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="member-form-span2">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
          </div>
        </section>

        <section className="home-card member-form-section">
          <h2 className="member-detail-h2">Acceso</h2>
          <div className="member-form-grid">
            <label>
              Usuario
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isEdit}
                readOnly={isEdit}
                autoComplete="off"
              />
            </label>
            <label>
              Contraseña {isEdit ? '(opcional)' : ''}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!isEdit}
                placeholder={isEdit ? 'Vacío = sin cambios' : ''}
                autoComplete="new-password"
              />
            </label>
          </div>
        </section>

        <div className="member-form-actions">
          <Link
            to={
              isEdit && id
                ? routes.personalDetail(parseInt(id, 10))
                : routes.personal
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
