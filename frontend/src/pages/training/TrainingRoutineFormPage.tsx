import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MmSelect } from '../../components/ui/MmSelect';
import { routes } from '../../config/member-management';
import { api } from '../../lib/api';
import {
  activityDifficultyLabel,
  routineDifficultyLabel,
} from '../../lib/activity-difficulty';
import { extractApiMessage } from '../../lib/extract-api-message';
import { fetchAllPaginatedRows } from '../../lib/fetch-all-paginated';
import {
  ROUTINE_WEEKDAY_BITS,
  ROUTINE_WEEKDAY_LABELS,
  ROUTINE_WEEKDAYS_ALL_MASK,
  hasRoutineWeekday,
  toggleRoutineWeekday,
} from '../../lib/training-weekdays';
import { useAuth } from '../../context/AuthContext';

type Mode = 'create' | 'edit';

type ActivityRow = {
  id: number;
  title: string;
  difficulty_level: string;
};

type RoutineLineForm = {
  activityId: number;
  weightKg: string;
  weekdaysMask: number;
};

function previewRoutineDifficulty(ordered: ActivityRow[]): string {
  const levels = ordered.map((a) =>
    (a.difficulty_level ?? 'media').trim().toLowerCase(),
  );
  const norm = levels.filter(
    (x) => x === 'baja' || x === 'media' || x === 'alta',
  );
  const uniq = [...new Set(norm)];
  if (uniq.length <= 1) return uniq[0] ?? 'media';
  return 'mixta';
}

export function TrainingRoutineFormPage({ mode }: { mode: Mode }) {
  const { id: idParam } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(mode === 'edit');

  const [catalog, setCatalog] = useState<ActivityRow[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [routineLines, setRoutineLines] = useState<RoutineLineForm[]>([]);
  const [isGeneral, setIsGeneral] = useState(false);
  const [pickId, setPickId] = useState('');

  const byId = useMemo(
    () => new Map(catalog.map((a) => [a.id, a])),
    [catalog],
  );

  const orderedActivities = useMemo(() => {
    return routineLines
      .map((line) => byId.get(line.activityId))
      .filter((a): a is ActivityRow => a != null);
  }, [byId, routineLines]);

  const previewLevel = useMemo(
    () => previewRoutineDifficulty(orderedActivities),
    [orderedActivities],
  );

  const activitySelectOptions = useMemo(
    () =>
      catalog.map((a) => ({
        value: String(a.id),
        label: `${a.title} (${activityDifficultyLabel(a.difficulty_level)})`,
      })),
    [catalog],
  );

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setError(null);
    void fetchAllPaginatedRows<ActivityRow>('/activities', 'activities')
      .then((activities) => {
        if (!cancelled) setCatalog(activities);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setCatalog([]);
        setError(
          extractApiMessage(err) ||
            'No se pudieron cargar los ejercicios del catálogo.',
        );
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || mode !== 'edit' || !idParam) return;
    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) {
      setLoadingData(false);
      setError('Identificador no válido.');
      return;
    }
    setLoadingData(true);
    api
      .get<{
        title: string;
        description: string | null;
        is_general?: boolean;
        exercises: Array<{
          activity_id: number;
          title?: string;
          difficulty_level?: string;
          weight_kg?: number | null;
          weekdays_mask?: number | null;
        }>;
      }>(`/training-routines/${id}`)
      .then(({ data: d }) => {
        setTitle(d.title);
        setDescription(d.description ?? '');
        setIsGeneral(d.is_general === true);
        setRoutineLines(
          (d.exercises ?? []).map((x) => ({
            activityId: x.activity_id,
            weightKg:
              x.weight_kg != null && !Number.isNaN(Number(x.weight_kg))
                ? String(x.weight_kg)
                : '',
            weekdaysMask:
              typeof x.weekdays_mask === 'number' &&
              x.weekdays_mask >= 1 &&
              x.weekdays_mask <= 127
                ? x.weekdays_mask & 127
                : ROUTINE_WEEKDAYS_ALL_MASK,
          })),
        );
        setCatalog((prev) => {
          const map = new Map(prev.map((a) => [a.id, a]));
          for (const x of d.exercises ?? []) {
            if (!map.has(x.activity_id)) {
              map.set(x.activity_id, {
                id: x.activity_id,
                title: x.title?.trim() || `Ejercicio ${x.activity_id}`,
                difficulty_level: x.difficulty_level ?? 'media',
              });
            }
          }
          return [...map.values()];
        });
        setError(null);
      })
      .catch(() => setError('No se pudo cargar la rutina.'))
      .finally(() => setLoadingData(false));
  }, [mode, idParam, user]);

  function addActivity() {
    const id = parseInt(pickId, 10);
    if (Number.isNaN(id)) {
      setError('Selecciona un ejercicio.');
      return;
    }
    if (routineLines.some((l) => l.activityId === id)) {
      setError('Ese ejercicio ya está en la rutina.');
      return;
    }
    setRoutineLines((prev) => [
      ...prev,
      {
        activityId: id,
        weightKg: '',
        weekdaysMask: ROUTINE_WEEKDAYS_ALL_MASK,
      },
    ]);
    setPickId('');
    setError(null);
  }

  function removeAt(i: number) {
    setRoutineLines((prev) => prev.filter((_, j) => j !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= routineLines.length) return;
    setRoutineLines((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  }

  function setWeightAt(i: number, raw: string) {
    setRoutineLines((prev) =>
      prev.map((l, j) => (j === i ? { ...l, weightKg: raw } : l)),
    );
  }

  function toggleDayAt(i: number, bit: number) {
    setRoutineLines((prev) =>
      prev.map((l, j) =>
        j === i
          ? {
              ...l,
              weekdaysMask: toggleRoutineWeekday(l.weekdaysMask, bit),
            }
          : l,
      ),
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const t = title.trim();
    if (!t) {
      setError('Indica el nombre de la rutina.');
      return;
    }
    if (routineLines.length === 0) {
      setError('Añade al menos un ejercicio.');
      return;
    }

    for (const line of routineLines) {
      const m = line.weekdaysMask & 127;
      if (m < 1) {
        setError('Cada ejercicio debe tener al menos un día de la semana.');
        return;
      }
    }

    for (const line of routineLines) {
      const trimmed = line.weightKg.trim();
      if (trimmed === '') continue;
      const n = parseFloat(trimmed.replace(',', '.'));
      if (!Number.isFinite(n) || n < 0) {
        setError('Indica un peso válido (kg) o déjalo vacío.');
        return;
      }
    }

    const body = {
      title: t,
      description: description.trim() || undefined,
      is_general: isGeneral,
      lines: routineLines.map((l) => {
        const trimmed = l.weightKg.trim();
        const base = {
          activity_id: l.activityId,
          weekdays_mask: l.weekdaysMask & 127,
        };
        if (trimmed === '') {
          return { ...base, weight_kg: null };
        }
        const n = parseFloat(trimmed.replace(',', '.'));
        return { ...base, weight_kg: n };
      }),
    };

    setSaving(true);
    try {
      if (mode === 'create') {
        await api.post('/training-routines', body);
      } else {
        const id = parseInt(idParam ?? '', 10);
        if (Number.isNaN(id)) {
          setError('Identificador no válido.');
          return;
        }
        await api.patch(`/training-routines/${id}`, body);
      }
      navigate(routes.rutinas, { replace: true });
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

  if (mode === 'edit' && loadingData) {
    return (
      <div className="mm-page">
        <p className="muted">Cargando rutina…</p>
      </div>
    );
  }

  const pageTitle =
    mode === 'create' ? 'Nueva rutina de entrenamiento' : 'Editar rutina';

  return (
    <div className="mm-page pay-manual-page">
      <header className="pay-manual-head">
        <div className="pay-manual-title-row">
          <h1>{pageTitle}</h1>
          <span className="muted pay-manual-crumb">Rutinas</span>
        </div>
        <Link to={routes.rutinas} className="btn-outline pay-manual-list-btn">
          Lista de rutinas
        </Link>
      </header>

      {error ? <p className="login-error">{error}</p> : null}

      <form className="pay-manual-form" onSubmit={(e) => void onSubmit(e)}>
        <div className="pay-manual-fields">
          <label className="pay-manual-row">
            <span className="pay-manual-label">
              Nombre de la rutina <span className="pay-req">*</span>
            </span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </label>

          <label className="pay-manual-row">
            <span className="pay-manual-label">Descripción</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </label>

          <label className="pay-manual-row member-form-checkbox">
            <input
              type="checkbox"
              checked={isGeneral}
              onChange={(e) => setIsGeneral(e.target.checked)}
            />
            Rutina general del club (sustituye la anterior marcada como general)
          </label>

          <div className="pay-manual-row">
            <span className="pay-manual-label">Nivel de la rutina</span>
            <div>
              <strong>{routineDifficultyLabel(previewLevel)}</strong>
              <p className="muted small" style={{ margin: '0.35rem 0 0' }}>
                Si todos los ejercicios comparten el mismo nivel, la rutina
                tendrá ese nivel; si hay varios distintos, será{' '}
                <strong>Mixta</strong>.
              </p>
            </div>
          </div>

          <div className="activity-staff-row">
            <label className="pay-manual-label-block">
              <span className="pay-manual-label">
                Añadir ejercicio <span className="pay-req">*</span>
              </span>
              <MmSelect
                value={pickId}
                onValueChange={setPickId}
                options={activitySelectOptions}
                placeholder={
                  catalog.length === 0
                    ? 'Sin ejercicios en el catálogo'
                    : '— Selecciona —'
                }
                disabled={catalog.length === 0}
              />
            </label>
            <button
              type="button"
              className="btn-outline"
              onClick={addActivity}
              disabled={catalog.length === 0}
            >
              Añadir a la rutina
            </button>
          </div>
          {catalog.length === 0 ? (
            <p className="muted">
              No hay ejercicios disponibles para elegir. Creá ejercicios en el
              módulo Ejercicios y volvé a esta pantalla.
            </p>
          ) : null}

          {routineLines.length === 0 ? (
            <p className="muted">Aún no hay ejercicios en el orden de trabajo.</p>
          ) : (
            <ol className="routine-exercise-list">
              {routineLines.map((line, i) => {
                const a = byId.get(line.activityId);
                if (!a) return null;
                return (
                  <li
                    key={`${line.activityId}-${i}`}
                    className="routine-exercise-item"
                  >
                    <span className="routine-exercise-title">{a.title}</span>
                    <span className="muted small">
                      {activityDifficultyLabel(a.difficulty_level)}
                    </span>
                    <label className="routine-weight-field">
                      <span className="muted small">Peso (kg)</span>
                      <input
                        type="number"
                        min={0}
                        max={999.99}
                        step={0.5}
                        placeholder="Opcional"
                        value={line.weightKg}
                        onChange={(e) => setWeightAt(i, e.target.value)}
                      />
                    </label>
                    <div className="routine-weekdays-block">
                      <span className="muted small">Días</span>
                      <div
                        className="routine-weekday-row"
                        role="group"
                        aria-label="Días de la semana para este ejercicio"
                      >
                        {ROUTINE_WEEKDAY_BITS.map((bit, di) => {
                          const on = hasRoutineWeekday(line.weekdaysMask, bit);
                          return (
                            <button
                              key={bit}
                              type="button"
                              className={
                                on
                                  ? 'routine-day-circle routine-day-circle--on'
                                  : 'routine-day-circle routine-day-circle--off'
                              }
                              onClick={() => toggleDayAt(i, bit)}
                              aria-pressed={on}
                              title={ROUTINE_WEEKDAY_LABELS[di] ?? ''}
                            >
                              {ROUTINE_WEEKDAY_LABELS[di]}
                            </button>
                          );
                        })}
                      </div>
                      <p className="muted small" style={{ margin: 0 }}>
                        L a D: lunes a domingo. Rojo = día activo; debe quedar al
                        menos uno.
                      </p>
                    </div>
                    <div className="routine-exercise-actions">
                      <button
                        type="button"
                        className="btn-outline"
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                      >
                        Subir
                      </button>
                      <button
                        type="button"
                        className="btn-outline"
                        disabled={i === routineLines.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        Bajar
                      </button>
                      <button
                        type="button"
                        className="btn-table btn-table--danger"
                        onClick={() => removeAt(i)}
                      >
                        Quitar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="pay-manual-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar rutina'}
          </button>
        </div>
      </form>
    </div>
  );
}
