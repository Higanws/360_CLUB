import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { extractApiMessage } from '../../lib/extract-api-message';
import { isPortalPreviewRole } from '../../lib/member-wellness-params';

/** Misma rejilla semanal que rutina: lun→dom. API nutrición: 0=dom, 1=lun … 6=sáb */
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

type PlanSectionKey = 'general' | 'personal';

type ScheduleSlotApi = {
  weekday: number;
  hour: number;
  event: string;
  dish?: string | null;
  ingredients?: { name: string; quantity: string }[] | null;
};

type NutritionGeneralPayload = {
  id: number;
  title: string;
  is_published: boolean;
  valid_from: string | null;
  valid_to: string | null;
  schedule_slots: ScheduleSlotApi[];
};

type NutritionPlanPayload = {
  member_id: number;
  first_name: string | null;
  last_name: string | null;
  valid_from: string | null;
  valid_to: string | null;
  schedule_slots: ScheduleSlotApi[];
};

function apiWeekdayToDayKey(wd: number): DayKey | null {
  const m: Record<number, DayKey> = {
    0: 'sun',
    1: 'mon',
    2: 'tue',
    3: 'wed',
    4: 'thu',
    5: 'fri',
    6: 'sat',
  };
  return m[wd] ?? null;
}

function formatSlotHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

function splitHeadDetail(event: string): { head: string; detail: string | null } {
  const t = event.trim();
  const i = t.indexOf('\n');
  if (i === -1) return { head: t, detail: null };
  const detail = t.slice(i + 1).trim();
  return { head: t.slice(0, i).trim() || t, detail: detail || null };
}

function slotsByDay(slots: ScheduleSlotApi[]): Record<DayKey, ScheduleSlotApi[]> {
  const out: Record<DayKey, ScheduleSlotApi[]> = {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  };
  for (const s of slots) {
    const key = apiWeekdayToDayKey(s.weekday);
    if (!key) continue;
    out[key].push(s);
  }
  for (const k of DAY_KEYS) {
    out[k].sort((a, b) => a.hour - b.hour || a.event.localeCompare(b.event));
  }
  return out;
}

function hasMeals(slots: ScheduleSlotApi[] | undefined): boolean {
  return (slots?.length ?? 0) > 0;
}

type DietPlanViewProps = {
  sectionKey: PlanSectionKey;
  label: string;
  title?: string | null;
  validFrom: string | null;
  validTo: string | null;
  slots: ScheduleSlotApi[];
  selected: { section: PlanSectionKey; day: DayKey } | null;
  onSelectDay: (section: PlanSectionKey, day: DayKey | null) => void;
};

function DietPlanView({
  sectionKey,
  label,
  title,
  validFrom,
  validTo,
  slots,
  selected,
  onSelectDay,
}: DietPlanViewProps) {
  const byDay = useMemo(() => slotsByDay(slots), [slots]);
  const hasAnyMeals = useMemo(
    () => DAY_KEYS.some((k) => (byDay[k] ?? []).length > 0),
    [byDay],
  );

  if (!hasAnyMeals) return null;

  const modalDay =
    selected?.section === sectionKey ? selected.day : null;

  return (
    <div className="mp-wellness-plan-block">
      <h3 className="mp-wellness-section-subtitle">
        {label}
        {title?.trim() ? (
          <span className="muted"> · {title.trim()}</span>
        ) : null}
      </h3>
      <p className="muted mp-wellness-meta">
        {validFrom || validTo ? (
          <>
            Vigencia: <strong>{validFrom ?? '—'}</strong>
            {' → '}
            <strong>{validTo ?? '—'}</strong>
          </>
        ) : (
          'Sin fechas de vigencia registradas.'
        )}
      </p>
      <div className="mp-routine-week">
        {DAY_KEYS.map((day) => {
          const daySlots = byDay[day] ?? [];
          const hasRows = daySlots.length > 0;
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
                  ? `${DAY_LABELS[day]}: abrir detalle con ${daySlots.length} comida(s)`
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
                {daySlots.map((slot) => (
                  <li
                    key={`${sectionKey}-${day}-${slot.weekday}-${slot.hour}`}
                    className="mp-routine-line"
                  >
                    <span className="mp-routine-line-title">{slot.event}</span>
                    <span className="muted mp-routine-weight">
                      {formatSlotHour(slot.hour)}
                    </span>
                  </li>
                ))}
              </ul>
              {!hasRows ? (
                <p className="muted mp-routine-empty">Sin comidas este día.</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {modalDay !== null && (byDay[modalDay] ?? []).length > 0 ? (
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
            aria-labelledby={`mp-diet-day-modal-title-${sectionKey}`}
          >
            <header className="mp-routine-day-modal-head">
              <h2
                id={`mp-diet-day-modal-title-${sectionKey}`}
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
                {(byDay[modalDay] ?? []).map((slot) => {
                  const { head, detail } = splitHeadDetail(slot.event);
                  const dishText =
                    (slot.dish ?? '').trim() || (detail?.trim() ? detail : '');
                  const ingredients = slot.ingredients ?? [];
                  return (
                    <article
                      key={`${sectionKey}-${slot.weekday}-${slot.hour}`}
                      className="mp-routine-exercise-card"
                    >
                      <h3 className="mp-routine-exercise-card-title">{head}</h3>
                      <p className="muted mp-routine-exercise-card-meta">
                        Hora: <strong>{formatSlotHour(slot.hour)}</strong>
                      </p>
                      <h4 className="mp-diet-section-title">Platillo</h4>
                      {dishText ? (
                        <p className="mp-routine-exercise-card-desc">{dishText}</p>
                      ) : (
                        <p className="muted small">Sin descripción del platillo.</p>
                      )}
                      <h4 className="mp-diet-section-title">Ingredientes</h4>
                      {ingredients.length > 0 ? (
                        <table className="mp-diet-ingredient-table">
                          <thead>
                            <tr>
                              <th scope="col">Ingrediente</th>
                              <th scope="col">Cantidad</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ingredients.map((ing, idx) => (
                              <tr key={`${slot.weekday}-${slot.hour}-ing-${idx}`}>
                                <td>{ing.name}</td>
                                <td>{ing.quantity || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="muted small">Sin ingredientes detallados.</p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MemberWeeklyDietPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const miembro = searchParams.get('miembro');
  const [general, setGeneral] = useState<NutritionGeneralPayload | null>(null);
  const [personal, setPersonal] = useState<NutritionPlanPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{
    section: PlanSectionKey;
    day: DayKey;
  } | null>(null);
  const [loaded, setLoaded] = useState(false);

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

  useEffect(() => {
    if (!user) return;
    if (needsPick) {
      setGeneral(null);
      setPersonal(null);
      setLoadError(null);
      setSelected(null);
      setLoaded(false);
      return;
    }
    const params =
      preview && pickedId !== undefined ? { member_id: pickedId } : undefined;
    setLoaded(false);
    api
      .get<{ general: NutritionGeneralPayload | null; personal: NutritionPlanPayload }>(
        '/member-wellness/my-nutrition-plan',
        { params },
      )
      .then(({ data }) => {
        setGeneral(data.general);
        setPersonal(data.personal);
        setLoadError(null);
        setLoaded(true);
      })
      .catch((e: unknown) => {
        if (axios.isAxiosError(e) && e.response?.status === 403) {
          setLoadError(extractApiMessage(e) || 'No tienes permiso para ver este socio.');
          return;
        }
        setLoadError(
          extractApiMessage(e) || 'No se pudo cargar el plan de nutrición.',
        );
      });
  }, [user, needsPick, preview, pickedId]);

  useEffect(() => {
    if (selected === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selected]);

  useEffect(() => {
    setSelected(null);
  }, [needsPick, pickedId, general?.id, personal?.member_id]);

  const showGeneral = general != null && hasMeals(general.schedule_slots);
  const showPersonal = personal != null && hasMeals(personal.schedule_slots);
  const showEmpty = loaded && !showGeneral && !showPersonal && !loadError;

  function onSelectDay(section: PlanSectionKey, day: DayKey | null) {
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
        <h2 className="mp-wellness-section-title">Dieta de la semana</h2>
        <p className="muted">
          Usa la barra «Vista de socio» arriba para buscar y seleccionar un miembro. Verás el mismo
          plan de comidas en solo lectura que en el portal del socio.
        </p>
      </section>
    );
  }

  return (
    <section className="mp-wellness-section">
      <h2 className="mp-wellness-section-title">Dieta de la semana</h2>
      {loadError ? <p className="login-error">{loadError}</p> : null}
      {!loaded && !loadError ? <p className="muted">Cargando plan…</p> : null}
      {showEmpty ? (
        <p className="muted">
          Aún no hay comidas planificadas (ni dieta general ni personalizada). El personal del club
          puede completar los planes desde gestión.
        </p>
      ) : null}
      {showGeneral || showPersonal ? (
        <>
          <p className="muted nutrition-cal-legend">
            Vista solo lectura. Puede aparecer la dieta <strong>general</strong> del club y/o tu plan{' '}
            <strong>personalizado</strong>.
          </p>
          <p className="muted small mp-routine-day-hint">
            Pulsá un día con comidas para ver el detalle de cada una (hora y descripción).
          </p>
          {showGeneral && general ? (
            <DietPlanView
              sectionKey="general"
              label="General"
              title={general.title}
              validFrom={general.valid_from}
              validTo={general.valid_to}
              slots={general.schedule_slots}
              selected={selected}
              onSelectDay={onSelectDay}
            />
          ) : null}
          {showPersonal && personal ? (
            <DietPlanView
              sectionKey="personal"
              label="Personalizado"
              validFrom={personal.valid_from}
              validTo={personal.valid_to}
              slots={personal.schedule_slots}
              selected={selected}
              onSelectDay={onSelectDay}
            />
          ) : null}
        </>
      ) : null}
    </section>
  );
}
