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
type RoutineSectionKey = 'general' | 'personal';

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

type RoutineBlock = {
  id: number;
  routine_id: number;
  routine_title: string;
  created_at: string;
  lines: TrainingLine[];
};

type TrainingContext = {
  week_start_default: string;
  general: RoutineBlock | null;
  personal: RoutineBlock | null;
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

function buildDaysFromBlock(block: RoutineBlock | null): Record<DayKey, WeekRow[]> {
  const days: Record<string, WeekRow[]> = {};
  for (const k of DAY_KEYS) days[k] = [];
  if (!block) return days as Record<DayKey, WeekRow[]>;
  for (const line of block.lines) {
    for (let i = 0; i < 7; i++) {
      if ((line.weekdays_mask & (1 << i)) !== 0) {
        const key = DAY_KEYS[i];
        days[key]!.push({
          routine_line_id: line.id,
          activity_id: line.activity_id,
          title: line.title,
          weight_kg: line.weight_kg,
        });
      }
    }
  }
  return days as Record<DayKey, WeekRow[]>;
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

function lineMapFromBlock(block: RoutineBlock | null): Map<number, TrainingLine> {
  const m = new Map<number, TrainingLine>();
  if (!block) return m;
  for (const line of block.lines) {
    m.set(line.id, line);
  }
  return m;
}

function hasExercises(days: Record<DayKey, WeekRow[]>): boolean {
  return DAY_KEYS.some((k) => (days[k] ?? []).length > 0);
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

type RoutineWeekSectionProps = {
  sectionKey: RoutineSectionKey;
  label: string;
  routineTitle: string;
  daysState: Record<DayKey, WeekRow[]>;
  lineByRoutineId: Map<number, TrainingLine>;
  selected: { section: RoutineSectionKey; day: DayKey } | null;
  onSelectDay: (section: RoutineSectionKey, day: DayKey | null) => void;
};

function RoutineWeekSection({
  sectionKey,
  label,
  routineTitle,
  daysState,
  lineByRoutineId,
  selected,
  onSelectDay,
}: RoutineWeekSectionProps) {
  if (!hasExercises(daysState)) return null;

  const modalDay =
    selected?.section === sectionKey ? selected.day : null;

  return (
    <div className="mp-wellness-plan-block">
      <h3 className="mp-wellness-section-subtitle">
        {label} · <span className="muted">{routineTitle}</span>
      </h3>
      <div className="mp-routine-week">
        {DAY_KEYS.map((day) => {
          const dayRows = daysState[day] ?? [];
          const hasRows = dayRows.length > 0;
          return (
            <div
              key={`${sectionKey}-${day}`}
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
                if (hasRows) onSelectDay(sectionKey, day);
              }}
              onKeyDown={(e) => {
                if (!hasRows) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectDay(sectionKey, day);
                }
              }}
            >
              <h3 className="mp-routine-day-title">{DAY_LABELS[day]}</h3>
              <ul className="mp-routine-list">
                {dayRows.map((row, idx) => (
                  <li
                    key={`${sectionKey}-${day}-${row.routine_line_id}-${idx}`}
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

      {modalDay !== null && (daysState[modalDay] ?? []).length > 0 ? (
        <div
          className="mp-routine-day-modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onSelectDay(sectionKey, null);
          }}
        >
          <div
            className="mp-routine-day-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`mp-routine-day-modal-title-${sectionKey}`}
          >
            <header className="mp-routine-day-modal-head">
              <h2
                id={`mp-routine-day-modal-title-${sectionKey}`}
                className="mp-routine-day-modal-title"
              >
                {label} — {DAY_LABELS[modalDay]}
              </h2>
              <button
                type="button"
                className="mp-routine-day-modal-close"
                aria-label="Cerrar"
                onClick={() => onSelectDay(sectionKey, null)}
              >
                ×
              </button>
            </header>
            <div className="mp-routine-day-modal-scroll">
              <div className="mp-routine-exercise-strip">
                {modalExercisesForDay(
                  daysState[modalDay] ?? [],
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
    </div>
  );
}

export function MemberWeeklyRoutinePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const miembro = searchParams.get('miembro');
  const [ctx, setCtx] = useState<TrainingContext | null>(null);
  const [weekStart, setWeekStart] = useState<string>('');
  const [generalDays, setGeneralDays] = useState<Record<DayKey, WeekRow[]> | null>(
    null,
  );
  const [personalDays, setPersonalDays] = useState<Record<DayKey, WeekRow[]> | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{
    section: RoutineSectionKey;
    day: DayKey;
  } | null>(null);

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
      setGeneralDays(null);
      setPersonalDays(null);
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
      setGeneralDays(buildDaysFromBlock(c.general));

      const snap = wRes.data.routine_snapshot_json;
      if (snap && isRecord(snap) && isRecord(snap.days) && c.personal) {
        setPersonalDays(parseDays(snap));
      } else {
        setPersonalDays(buildDaysFromBlock(c.personal));
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
    if (selected === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selected]);

  const generalLines = useMemo(
    () => lineMapFromBlock(ctx?.general ?? null),
    [ctx?.general],
  );
  const personalLines = useMemo(
    () => lineMapFromBlock(ctx?.personal ?? null),
    [ctx?.personal],
  );

  useEffect(() => {
    setSelected(null);
  }, [needsPick, pickedId, weekStart, ctx?.general?.id, ctx?.personal?.id]);

  const showGeneral =
    generalDays != null && hasExercises(generalDays) && ctx?.general;
  const showPersonal =
    personalDays != null && hasExercises(personalDays) && ctx?.personal;
  const showEmpty = ctx && !showGeneral && !showPersonal;

  function onSelectDay(section: RoutineSectionKey, day: DayKey | null) {
    if (day === null) {
      setSelected(null);
      return;
    }
    setSelected({ section, day });
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
        <p className="muted">Cargando rutinas…</p>
      ) : showEmpty ? (
        <p className="muted">
          Todavía no tienes rutina general ni personalizada asignada. Cuando el personal del club
          configure las rutinas, podrás consultarlas aquí.
        </p>
      ) : (
        <>
          <p className="muted mp-wellness-meta">
            Semana (lunes): <strong>{weekStart || '—'}</strong>
          </p>
          <p className="muted nutrition-cal-legend">
            Vista solo lectura. Puede aparecer la rutina <strong>general</strong> del club y/o tu
            entrenamiento <strong>personalizado</strong>.
          </p>
          <p className="muted small mp-routine-day-hint">
            Pulsá un día con ejercicios para ver la descripción y los vídeos incrustados de cada uno.
          </p>
          {showGeneral && generalDays && ctx.general ? (
            <RoutineWeekSection
              sectionKey="general"
              label="General"
              routineTitle={ctx.general.routine_title}
              daysState={generalDays}
              lineByRoutineId={generalLines}
              selected={selected}
              onSelectDay={onSelectDay}
            />
          ) : null}
          {showPersonal && personalDays && ctx.personal ? (
            <RoutineWeekSection
              sectionKey="personal"
              label="Personalizado"
              routineTitle={ctx.personal.routine_title}
              daysState={personalDays}
              lineByRoutineId={personalLines}
              selected={selected}
              onSelectDay={onSelectDay}
            />
          ) : null}
        </>
      )}
    </section>
  );
}
