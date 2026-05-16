import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ActivityYoutubeEmbed } from '../../components/ActivityYoutubeEmbed';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { activityDifficultyLabel } from '../../lib/activity-difficulty';
import { extractApiMessage } from '../../lib/extract-api-message';
import { isPortalPreviewRole } from '../../lib/member-wellness-params';

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
  description: string | null;
  difficulty_level: string;
  sort_order: number;
  weight_kg: number | null;
  weekdays_mask: number;
  day_keys: string[];
  videos: { id: number; url: string; sort_order: number }[];
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

type ModalExercise = {
  routine_line_id: number;
  title: string;
  description: string | null;
  difficulty_label: string;
  weight_kg: number | null;
  videos: { id: number; url: string }[];
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

function parseDays(snap: Record<string, unknown>): Record<DayKey, WeekRow[]> {
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

function modalExercisesForDay(
  rows: WeekRow[],
  lineByRoutineId: Map<number, TrainingLine>,
): ModalExercise[] {
  return rows.map((row) => {
    const line = lineByRoutineId.get(row.routine_line_id);
    const weight =
      row.weight_kg !== undefined && row.weight_kg !== null
        ? row.weight_kg
        : (line?.weight_kg ?? null);
    const videos = line?.videos ?? [];
    return {
      routine_line_id: row.routine_line_id,
      title: (line?.title ?? row.title).trim() || row.title,
      description: line?.description ?? null,
      difficulty_label: activityDifficultyLabel(line?.difficulty_level),
      weight_kg:
        weight !== undefined && Number.isFinite(Number(weight))
          ? Number(weight)
          : null,
      videos: [...videos].sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return a.id - b.id;
      }),
    };
  });
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
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null);

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

  useEffect(() => {
    if (selectedDay === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedDay(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedDay]);

  const lineByRoutineId = useMemo(() => {
    const m = new Map<number, TrainingLine>();
    const lines = ctx?.assignment?.lines;
    if (!lines) return m;
    for (const line of lines) {
      m.set(line.id, line);
    }
    return m;
  }, [ctx?.assignment?.lines]);

  useEffect(() => {
    setSelectedDay(null);
  }, [needsPick, pickedId, weekStart, ctx?.assignment?.id]);

  const hasAssignment = Boolean(ctx?.assignment);

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
          en solo lectura que en el portal del socio.
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
          contigo, podrás consultarla aquí.
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
          <p className="muted nutrition-cal-legend">
            Vista solo lectura. La rutina la define y actualiza el personal del club desde
            gestión.
          </p>
          <p className="muted small mp-routine-day-hint">
            Pulsá un día con ejercicios para ver la descripción y los vídeos incrustados de cada uno.
          </p>
          <div className="mp-routine-week">
            {DAY_KEYS.map((day) => {
              const dayRows = daysState?.[day] ?? [];
              const hasRows = dayRows.length > 0;
              return (
                <div
                  key={day}
                  className={
                    hasRows
                      ? 'mp-routine-day mp-routine-day--clickable'
                      : 'mp-routine-day'
                  }
                  role={hasRows ? 'button' : undefined}
                  tabIndex={hasRows ? 0 : undefined}
                  aria-label={
                    hasRows
                      ? `${DAY_LABELS[day]}: abrir detalle con ${dayRows.length} ejercicio(s)`
                      : undefined
                  }
                  onClick={() => {
                    if (hasRows) setSelectedDay(day);
                  }}
                  onKeyDown={(e) => {
                    if (!hasRows) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedDay(day);
                    }
                  }}
                >
                  <h3 className="mp-routine-day-title">{DAY_LABELS[day]}</h3>
                  <ul className="mp-routine-list">
                    {dayRows.map((row, idx) => (
                      <li
                        key={`${day}-${row.routine_line_id}-${idx}`}
                        className="mp-routine-line"
                      >
                        <span className="mp-routine-line-title">{row.title}</span>
                        {row.weight_kg != null && Number.isFinite(row.weight_kg) ? (
                          <span className="muted mp-routine-weight">{row.weight_kg} kg</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  {!hasRows ? (
                    <p className="muted mp-routine-empty">Sin ejercicios este día.</p>
                  ) : null}
                </div>
              );
            })}
          </div>
          {selectedDay !== null && (daysState?.[selectedDay] ?? []).length > 0 ? (
            <div
              className="mp-routine-day-modal-overlay"
              role="presentation"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setSelectedDay(null);
              }}
            >
              <div
                className="mp-routine-day-modal-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="mp-routine-day-modal-title"
              >
                <header className="mp-routine-day-modal-head">
                  <h2 id="mp-routine-day-modal-title" className="mp-routine-day-modal-title">
                    {DAY_LABELS[selectedDay]}
                  </h2>
                  <button
                    type="button"
                    className="mp-routine-day-modal-close"
                    aria-label="Cerrar"
                    onClick={() => setSelectedDay(null)}
                  >
                    ×
                  </button>
                </header>
                <div className="mp-routine-day-modal-scroll">
                  <p className="muted small mp-routine-day-modal-sub">
                    Deslizá horizontalmente para ver cada ejercicio.
                  </p>
                  <div className="mp-routine-exercise-strip">
                    {modalExercisesForDay(
                      daysState?.[selectedDay] ?? [],
                      lineByRoutineId,
                    ).map((ex) => (
                      <article
                        key={ex.routine_line_id}
                        className="mp-routine-exercise-card"
                      >
                        <h3 className="mp-routine-exercise-card-title">{ex.title}</h3>
                        <p className="muted mp-routine-exercise-card-meta">
                          Dificultad: <strong>{ex.difficulty_label}</strong>
                          {ex.weight_kg != null && Number.isFinite(ex.weight_kg) ? (
                            <>
                              {' · '}
                              Peso: <strong>{ex.weight_kg} kg</strong>
                            </>
                          ) : null}
                        </p>
                        <p className="mp-routine-exercise-card-desc">
                          {ex.description?.trim() ? ex.description : 'Sin descripción.'}
                        </p>
                        {ex.videos.length === 0 ? (
                          <p className="muted small">Sin vídeos enlazados.</p>
                        ) : (
                          <div className="mp-routine-exercise-videos">
                            {ex.videos.map((v) => (
                              <div key={v.id} className="mp-routine-exercise-video-item">
                                <ActivityYoutubeEmbed
                                  url={v.url}
                                  iframeTitle={`${ex.title} — vídeo`}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
