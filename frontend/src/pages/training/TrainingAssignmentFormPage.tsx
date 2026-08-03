import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MmCombobox } from '../../components/ui/MmCombobox';
import { MmSelect } from '../../components/ui/MmSelect';
import { routes } from '../../config/member-management';
import { api } from '../../lib/api';
import {
  searchMembersLite,
  type MemberLiteRow,
} from '../../lib/members-api';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { extractApiMessage } from '../../lib/extract-api-message';
import { fetchAllPaginatedRows } from '../../lib/fetch-all-paginated';
import { useAuth } from '../../context/AuthContext';

type RoutineRow = {
  id: number;
  title: string;
  difficulty_level: string;
  exercise_count: number;
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
  const [members, setMembers] = useState<MemberLiteRow[]>([]);
  const [searchResults, setSearchResults] = useState<MemberLiteRow[]>([]);
  const [staff, setStaff] = useState<StaffPayload['staff']>([]);

  const [routineId, setRoutineId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const debouncedMemberSearch = useDebouncedValue(memberSearch, 300);
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
    let cancelled = false;
    Promise.all([
      fetchAllPaginatedRows<RoutineRow>('/training-routines', 'routines'),
      fetchAllPaginatedRows<StaffPayload['staff'][number]>('/staff', 'staff'),
    ])
      .then(([rRows, sRows]) => {
        if (cancelled) return;
        setRoutines(rRows);
        setStaff(sRows);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            extractApiMessage(err) || 'No se pudieron cargar rutinas o staff.',
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = debouncedMemberSearch.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    searchMembersLite(q, 20)
      .then((rows) => {
        if (!cancelled) setSearchResults(rows);
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user, debouncedMemberSearch]);

  const memberById = useMemo(() => {
    const m = new Map<number, MemberLiteRow>();
    for (const x of members) m.set(x.id, x);
    for (const x of searchResults) m.set(x.id, x);
    return m;
  }, [members, searchResults]);

  const membersPickList = useMemo(
    () => searchResults.filter((m) => !memberIds.includes(m.id)).slice(0, 20),
    [searchResults, memberIds],
  );

  const memberComboboxOptions = useMemo(
    () =>
      membersPickList.map((m) => ({
        value: String(m.id),
        label: personLabel(m, m.id),
      })),
    [membersPickList],
  );

  const routineSelectOptions = useMemo(
    () =>
      routines.map((r) => ({
        value: String(r.id),
        label: `${r.title} (${r.exercise_count} ejercicios)`,
      })),
    [routines],
  );

  const staffSelectOptions = useMemo(
    () =>
      staff.map((s) => ({
        value: String(s.id),
        label: personLabel(s, s.id),
      })),
    [staff],
  );

  const staffById = useMemo(() => {
    const m = new Map<number, StaffPayload['staff'][0]>();
    for (const x of staff) m.set(x.id, x);
    return m;
  }, [staff]);

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
    const hit = searchResults.find((m) => m.id === id);
    if (hit) {
      setMembers((prev) =>
        prev.some((m) => m.id === id) ? prev : [...prev, hit],
      );
    }
    setMemberIds((p) => [...p, id]);
    setMemberSearch('');
    setSearchResults([]);
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
            <MmSelect
              required
              value={routineId}
              onValueChange={setRoutineId}
              options={routineSelectOptions}
              placeholder="— Selecciona —"
            />
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
              <MmCombobox
                query={memberSearch}
                onQueryChange={setMemberSearch}
                options={memberComboboxOptions}
                onSelect={(v) => addMemberFromPicker(parseInt(v, 10))}
                placeholder="Buscar socio (mín. 2 caracteres)…"
                emptyMessage={
                  memberSearch.trim().length < 2
                    ? 'Escribe al menos 2 caracteres.'
                    : 'Ningún socio coincide (o ya está añadido).'
                }
                aria-label="Buscar socio para añadir"
              />
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
              <MmSelect
                value={pickTrainer}
                onValueChange={setPickTrainer}
                options={staffSelectOptions}
                placeholder="— Selecciona —"
                disabled={isStaffOnly}
              />
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
