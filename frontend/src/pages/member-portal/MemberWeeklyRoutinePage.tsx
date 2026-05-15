import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { extractApiMessage } from '../../lib/extract-api-message';
import { isPortalPreviewRole } from '../../lib/member-wellness-params';
import { useAuth } from '../../context/AuthContext';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type DayKey = (typeof DAY_KEYS)[number];

const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Lunes',
  tue: 'Martes',
  wed: 'Miércoles',
  thu: 'Jueves',
  fri: 'Viernes',
  sat: 'Sábado',
  sun: 'Domingo',
};

type TrainingLine = {
  id: number;
  activity_id: number;
  title: string;
  sort_order: number;
  weight_kg: number | null;
  weekdays_mask: number;
  day_keys: string[];
};

type TrainingContext = {
  week_start_default: string;
  assignment: null | {
    id: number;
    routine_id: number;
    routine_title: string;
    created_at: string;
    lines: TrainingLine[];
  };
};

type WeekRow = {
  routine_line_id: number;
  activity_id: number;
  title: string;
  weight_kg?: number | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function buildDefaultSnapshot(ctx: TrainingContext): Record<string, unknown> {
  const days: Record<string, WeekRow[]> = {};
  for (const k of DAY_KEYS) days[k] = [];
  const a = ctx.assignment;
  if (!a) {
    return { days, routineTitle: '', assignmentId: null };
  }
  for (const line of a.lines) {
    for (let i = 0; i < 7; i++) {
      if ((line.weekdays_mask & (1 << i)) !== 0) {
        const key = DAY_KEYS[i];
        days[key].push({
          routine_line_id: line.id,
          activity_id: line.activity_id,
          title: line.title,
          weight_kg: line.weight_kg,
        });
      }
    }
  }
  return {
    days,
    routineTitle: a.routine_title,
    assignmentId: a.id,
  };
}

function parseDays(
  snap: Record<string, unknown>,
): Record<DayKey, WeekRow[]> {
  const raw = snap.days;
  const out: Record<DayKey, WeekRow[]> = {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  };
  if (!isRecord(raw)) return out;
  for (const k of DAY_KEYS) {
    const arr = raw[k];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (!isRecord(item)) continue;
      const routine_line_id = Number(item.routine_line_id);
      const activity_id = Number(item.activity_id);
      const title = String(item.title ?? '').trim();
      if (!Number.isFinite(routine_line_id) || !Number.isFinite(activity_id) || !title) {
        continue;
      }
      out[k].push({
        routine_line_id,
        activity_id,
        title,
        weight_kg:
          item.weight_kg === null || item.weight_kg === undefined
            ? null
            : Number(item.weight_kg),
      });
    }
  }
  return out;
}

export function MemberWeeklyRoutinePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const miembro = searchParams.get('miembro');
  const [ctx, setCtx] = useState<TrainingContext | null>(null);
  const [weekStart, setWeekStart] = useState<string>('');
  const [daysState, setDaysState] = useState<Record<DayKey, WeekRow[]> | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [saving, setSaving] = useState(false);

  const preview = isPortalPreviewRole(user?.role_name);
  const pickedId =
    preview && miembro != null && miembro !== ''
      ? (() => {
          const n = parseInt(miembro, 10);
          return Number.isFinite(n) && n > 0 ? n : undefined;
        })()
      : undefined;
  const needsPick = preview && pickedId === undefined;

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  const loadAll = useCallback(async () => {
    if (!user) return;
    if (needsPick) {
      setCtx(null);
      setDaysState(null);
      setWeekStart('');
      setLoadError(null);
      return;
    }
    const params =
      preview && pickedId !== undefined ? { member_id: pickedId } : undefined;
    setLoadError(null);
    try {
      const [cRes, wRes] = await Promise.all([
        api.get<TrainingContext>('/member-wellness/my-training-context', {
          params,
        }),
        api.get<{
          week_start: string;
          routine_snapshot_json: Record<string, unknown> | null;
        }>('/member-wellness/weekly-routine', { params }),
      ]);
      const c = cRes.data;
      setCtx(c);
      const ws = wRes.data.week_start || c.week_start_default;
      setWeekStart(ws);
      const snap = wRes.data.routine_snapshot_json;
      if (snap && isRecord(snap) && isRecord(snap.days)) {
        setDaysState(parseDays(snap));
      } else {
        setDaysState(parseDays(buildDefaultSnapshot(c)));
      }
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 403) {
        setLoadError(extractApiMessage(e) || 'No tienes permiso para ver este socio.');
        return;
      }
      setLoadError(extractApiMessage(e) || 'No se pudo cargar la rutina.');
    }
  }, [user, needsPick, preview, pickedId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const hasAssignment = Boolean(ctx?.assignment);

  const snapshotPayload = useMemo(() => {
    if (!daysState || !ctx?.assignment) {
      return null;
    }
    return {
      days: DAY_KEYS.reduce(
        (acc, k) => {
          acc[k] = daysState[k];
          return acc;
        },
        {} as Record<string, WeekRow[]>,
      ),
      routineTitle: ctx.assignment.routine_title,
      assignmentId: ctx.assignment.id,
    };
  }, [daysState, ctx]);

  async function handleSave() {
    if (!snapshotPayload || !weekStart) return;
    setSaving(true);
    setSaveError(null);
    setSaveOk(false);
    try {
      await api.patch('/member-wellness/weekly-routine', {
        week_start: weekStart,
        routine_snapshot_json: snapshotPayload,
        ...(preview && pickedId !== undefined ? { member_id: pickedId } : {}),
      });
      setSaveOk(true);
    } catch (e: unknown) {
      setSaveError(extractApiMessage(e) || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  function updateTitle(day: DayKey, index: number, title: string) {
    setDaysState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [day]: [...prev[day]] };
      const row = next[day][index];
      if (row) next[day][index] = { ...row, title };
      return next;
    });
  }

  function removeRow(day: DayKey, index: number) {
    setDaysState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [day]: prev[day].filter((_, i) => i !== index) };
      return next;
    });
  }

  function restoreTemplate() {
    if (!ctx) return;
    setDaysState(parseDays(buildDefaultSnapshot(ctx)));
    setSaveOk(false);
  }

  if (loading || !user) {
    return (
      <section className="mp-wellness-section">
        <p className="muted">Cargando…</p>
      </section>
    );
  }

  if (needsPick) {
    return (
      <section className="mp-wellness-section">
        <h2 className="mp-wellness-section-title">Rutina de la semana</h2>
        <p className="muted">
          Usa la barra «Vista de socio» arriba para elegir un miembro. Verás la misma rutina
          asignada y el plan semanal que él puede editar desde el portal.
        </p>
      </section>
    );
  }

  return (
    <section className="mp-wellness-section">
      <h2 className="mp-wellness-section-title">Rutina de la semana</h2>
      {loadError ? <p className="login-error">{loadError}</p> : null}
      {!ctx ? (
        <p className="muted">Cargando asignación…</p>
      ) : !hasAssignment ? (
        <p className="muted">
          Todavía no tienes una rutina asignada. Cuando el personal del club vincule una rutina
          contigo, podrás ver los ejercicios y guardar tu plan semanal aquí.
        </p>
      ) : (
        <>
          <p className="muted mp-wellness-meta">
            Semana (lunes): <strong>{weekStart || '—'}</strong>
            {ctx.assignment ? (
              <>
                {' · '}
                Rutina: <strong>{ctx.assignment.routine_title}</strong>
              </>
            ) : null}
          </p>
          <div className="mp-routine-actions">
            <button type="button" className="btn-outline" onClick={() => restoreTemplate()}>
              Restaurar desde plantilla
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={saving || !daysState}
              onClick={() => void handleSave()}
            >
              {saving ? 'Guardando…' : 'Guardar semana'}
            </button>
          </div>
          {saveError ? <p className="login-error">{saveError}</p> : null}
          {saveOk ? <p className="muted">Cambios guardados.</p> : null}
          <div className="mp-routine-week">
            {DAY_KEYS.map((day) => (
              <div key={day} className="mp-routine-day">
                <h3 className="mp-routine-day-title">{DAY_LABELS[day]}</h3>
                <ul className="mp-routine-list">
                  {(daysState?.[day] ?? []).map((row, idx) => (
                    <li key={`${day}-${row.routine_line_id}-${idx}`} className="mp-routine-line">
                      <input
                        type="text"
                        className="mp-routine-line-input"
                        value={row.title}
                        onChange={(e) => updateTitle(day, idx, e.target.value)}
                        aria-label={`Ejercicio ${idx + 1} el ${DAY_LABELS[day]}`}
                      />
                      {row.weight_kg != null && Number.isFinite(row.weight_kg) ? (
                        <span className="muted mp-routine-weight">
                          {row.weight_kg} kg
                        </span>
                      ) : null}
                      <button
                        type="button"
                        className="btn-outline mp-routine-remove"
                        onClick={() => removeRow(day, idx)}
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
                {(daysState?.[day] ?? []).length === 0 ? (
                  <p className="muted mp-routine-empty">Sin ejercicios este día.</p>
                ) : null}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
