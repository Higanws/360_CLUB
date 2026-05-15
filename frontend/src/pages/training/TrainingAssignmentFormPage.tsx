import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../../config/member-management';
import { api } from '../../lib/api';
import { extractApiMessage } from '../../lib/extract-api-message';
import { useAuth } from '../../context/AuthContext';

type RoutineRow = {
  id: number;
  title: string;
  difficulty_level: string;
  exercise_count: number;
};

type MembersPayload = {
  members: Array<{
    id: number;
    first_name: string | null;
    last_name: string | null;
  }>;
};

type StaffPayload = {
  staff: Array<{
    id: number;
    first_name: string | null;
    last_name: string | null;
  }>;
};

function personLabel(
  m: { first_name?: string | null; last_name?: string | null } | undefined,
  id: number,
): string {
  const parts = [m?.first_name, m?.last_name].filter(Boolean).join(' ').trim();
  if (parts) return parts;
  return `ID ${id}`;
}

export function TrainingAssignmentFormPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [routines, setRoutines] = useState<RoutineRow[]>([]);
  const [members, setMembers] = useState<MembersPayload['members']>([]);
  const [staff, setStaff] = useState<StaffPayload['staff']>([]);

  const [routineId, setRoutineId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [pickTrainer, setPickTrainer] = useState('');
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [trainerMemberIds, setTrainerMemberIds] = useState<number[]>([]);

  const isStaffOnly =
    (user?.role_name?.trim().toLowerCase() ?? '') === 'staff_member';

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get<RoutineRow[]>('/training-routines'),
      api.get<MembersPayload>('/members'),
      api.get<StaffPayload>('/staff'),
    ])
      .then(([rRes, mRes, sRes]) => {
        setRoutines(rRes.data);
        setMembers(mRes.data.members ?? []);
        setStaff(sRes.data.staff ?? []);
        setError(null);
      })
      .catch(() => setError('No se pudieron cargar rutinas, socios o staff.'));
  }, [user]);

  const memberById = useMemo(() => {
    const m = new Map<number, MembersPayload['members'][0]>();
    for (const x of members) m.set(x.id, x);
    return m;
  }, [members]);

  const staffById = useMemo(() => {
    const m = new Map<number, StaffPayload['staff'][0]>();
    for (const x of staff) m.set(x.id, x);
    return m;
  }, [staff]);

  const membersPickList = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    const pool = members.filter((m) => !memberIds.includes(m.id));
    if (!q) return [];
    return pool
      .filter((m) => {
        const blob = [m.first_name, m.last_name, String(m.id)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return blob.includes(q);
      })
      .slice(0, 20);
  }, [members, memberSearch, memberIds]);

  useEffect(() => {
    if (!user) return;
    if (isStaffOnly) {
      setTrainerMemberIds([user.id]);
    }
  }, [user, isStaffOnly]);

  function addMemberFromPicker(id: number) {
    if (memberIds.includes(id)) {
      setError('Ese socio ya está en la lista.');
      return;
    }
    setMemberIds((p) => [...p, id]);
    setMemberSearch('');
    setError(null);
  }

  function addTrainer() {
    const id = parseInt(pickTrainer, 10);
    if (Number.isNaN(id)) {
      setError('Selecciona un entrenador.');
      return;
    }
    if (isStaffOnly && user && id !== user.id) {
      setError('Como staff solo puedes incluirte a ti como entrenador.');
      return;
    }
    if (trainerMemberIds.includes(id)) {
      setError('Ese entrenador ya está en la lista.');
      return;
    }
    setTrainerMemberIds((p) => [...p, id]);
    setPickTrainer('');
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const rid = parseInt(routineId, 10);
    if (Number.isNaN(rid)) {
      setError('Selecciona una rutina.');
      return;
    }
    if (memberIds.length === 0) {
      setError('Añade al menos un socio.');
      return;
    }
    if (trainerMemberIds.length === 0) {
      setError('Añade al menos un entrenador.');
      return;
    }
    if (isStaffOnly && user) {
      const ok = trainerMemberIds.every((t) => t === user.id);
      if (!ok) {
        setError('Solo puedes incluirte a ti como entrenador.');
        return;
      }
    }
    setSaving(true);
    try {
      await api.post('/training-assignments', {
        routine_id: rid,
        member_ids: memberIds,
        trainer_member_ids: trainerMemberIds,
      });
      navigate(routes.rutinasAsignaciones, { replace: true });
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

  return (
    <div className="mm-page pay-manual-page">
      <header className="pay-manual-head">
        <div className="pay-manual-title-row">
          <h1>Nueva asignación de entrenamiento</h1>
          <span className="muted pay-manual-crumb">Rutinas</span>
        </div>
        <Link
          to={routes.rutinasAsignaciones}
          className="btn-outline pay-manual-list-btn"
        >
          Lista de asignaciones
        </Link>
      </header>

      {error ? <p className="login-error">{error}</p> : null}

      <form className="pay-manual-form" onSubmit={(e) => void onSubmit(e)}>
        <div className="pay-manual-fields">
          <label className="pay-manual-row">
            <span className="pay-manual-label">
              Rutina <span className="pay-req">*</span>
            </span>
            <select
              required
              value={routineId}
              onChange={(e) => setRoutineId(e.target.value)}
            >
              <option value="">— Selecciona —</option>
              {routines.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.title} ({r.exercise_count} ejercicios)
                </option>
              ))}
            </select>
          </label>

          <div className="pay-manual-row member-picker-block">
            <div className="pay-manual-label-block member-picker">
              <span className="pay-manual-label">
                Socios <span className="pay-req">*</span>
              </span>
              <p className="muted small" style={{ margin: '0 0 0.4rem' }}>
                Busca por nombre o ID y pulsa en un socio de la lista para
                añadirlo. Repite para varios socios.
              </p>
              <input
                type="search"
                className="member-picker-input"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Buscar socio…"
                autoComplete="off"
                aria-controls="member-picker-results"
                aria-expanded={memberSearch.trim().length > 0}
              />
              {memberSearch.trim() ? (
                <ul
                  id="member-picker-results"
                  className="member-picker-results"
                  role="listbox"
                >
                  {membersPickList.length === 0 ? (
                    <li className="member-picker-empty muted">
                      Ningún socio coincide (o ya está añadido).
                    </li>
                  ) : (
                    membersPickList.map((m) => (
                      <li key={m.id} role="option">
                        <button
                          type="button"
                          className="member-picker-option"
                          onClick={() => addMemberFromPicker(m.id)}
                        >
                          {personLabel(m, m.id)}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              ) : null}
            </div>
          </div>

          {memberIds.length === 0 ? (
            <p className="muted">Aún no hay socios seleccionados.</p>
          ) : (
            <ul className="activity-trainer-chips" aria-label="Socios">
              {memberIds.map((id) => (
                <li key={id} className="activity-trainer-chip">
                  <span>{personLabel(memberById.get(id), id)}</span>
                  <button
                    type="button"
                    className="btn-table btn-table--danger"
                    onClick={() =>
                      setMemberIds((p) => p.filter((x) => x !== id))
                    }
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="activity-staff-row">
            <label className="pay-manual-label-block">
              <span className="pay-manual-label">
                Añadir entrenador <span className="pay-req">*</span>
              </span>
              <select
                value={pickTrainer}
                onChange={(e) => setPickTrainer(e.target.value)}
                disabled={isStaffOnly}
              >
                <option value="">— Selecciona —</option>
                {staff.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {personLabel(s, s.id)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn-outline"
              onClick={addTrainer}
              disabled={isStaffOnly}
            >
              Añadir entrenador
            </button>
          </div>
          {isStaffOnly ? (
            <p className="muted small" style={{ margin: '0 0 0.5rem' }}>
              Tu cuenta de staff queda fijada como entrenador de esta
              asignación; no puedes añadir a otros entrenadores.
            </p>
          ) : null}

          {trainerMemberIds.length === 0 ? (
            <p className="muted">Aún no hay entrenadores seleccionados.</p>
          ) : (
            <ul className="activity-trainer-chips" aria-label="Entrenadores">
              {trainerMemberIds.map((id) => (
                <li key={id} className="activity-trainer-chip">
                  <span>{personLabel(staffById.get(id), id)}</span>
                  {!isStaffOnly ? (
                    <button
                      type="button"
                      className="btn-table btn-table--danger"
                      onClick={() =>
                        setTrainerMemberIds((p) => p.filter((x) => x !== id))
                      }
                    >
                      Quitar
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="pay-manual-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar asignación'}
          </button>
        </div>
      </form>
    </div>
  );
}
