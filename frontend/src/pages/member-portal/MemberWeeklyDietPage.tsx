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

/** Primera línea = título en el modal; resto = detalle (notas del nutricionista). */
function splitHeadDetail(event: string): { head: string; detail: string | null } {
  const t = event.trim();
  const i = t.indexOf('\n');
  if (i === -1) return { head: t, detail: null };
  const detail = t.slice(i + 1).trim();
  return { head: t.slice(0, i).trim() || t, detail: detail || null };
}

type ScheduleSlotApi = {
  weekday: number;
  hour: number;
  event: string;
  dish?: string | null;
  ingredients?: { name: string; quantity: string }[] | null;
};

type PlanPayload = {
  member_id: number;
  first_name: string | null;
  last_name: string | null;
  valid_from: string | null;
  valid_to: string | null;
  schedule_slots: ScheduleSlotApi[];
};

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

export function MemberWeeklyDietPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const miembro = searchParams.get('miembro');
  const [plan, setPlan] = useState<PlanPayload | null>(null);
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

  useEffect(() => {
    if (!user) return;
    if (needsPick) {
      setPlan(null);
      setLoadError(null);
      setSelectedDay(null);
      return;
    }
    const params =
      preview && pickedId !== undefined ? { member_id: pickedId } : undefined;
    api
      .get<{ plan: PlanPayload }>('/member-wellness/my-nutrition-plan', {
        params,
      })
      .then(({ data }) => {
        setPlan(data.plan);
        setLoadError(null);
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
    if (selectedDay === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedDay(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedDay]);

  useEffect(() => {
    setSelectedDay(null);
  }, [needsPick, pickedId, plan?.member_id]);

  const byDay = useMemo(() => {
    if (!plan?.schedule_slots?.length) {
      return slotsByDay([]);
    }
    return slotsByDay(plan.schedule_slots);
  }, [plan]);

  const hasAnyMeals = useMemo(
    () => DAY_KEYS.some((k) => (byDay[k] ?? []).length > 0),
    [byDay],
  );

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
      {plan ? (
        <>
          <p className="muted mp-wellness-meta">
            {plan.valid_from || plan.valid_to ? (
              <>
                Vigencia: <strong>{plan.valid_from ?? '—'}</strong>
                {' → '}
                <strong>{plan.valid_to ?? '—'}</strong>
              </>
            ) : (
              'Sin fechas de vigencia registradas.'
            )}
          </p>
          {!hasAnyMeals ? (
            <p className="muted">
              Aún no hay comidas planificadas. Tu entrenador o nutricionista puede completar el plan
              desde gestión del club.
            </p>
          ) : (
            <>
              <p className="muted nutrition-cal-legend">
                Vista solo lectura. Los mismos datos provienen del plan de nutrición gestionado por
                el personal del club.
              </p>
              <p className="muted small mp-routine-day-hint">
                Pulsá un día con comidas para ver el detalle de cada una (hora y descripción).
              </p>
              <div className="mp-routine-week">
                {DAY_KEYS.map((day) => {
                  const daySlots = byDay[day] ?? [];
                  const hasRows = daySlots.length > 0;
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
                          ? `${DAY_LABELS[day]}: abrir detalle con ${daySlots.length} comida(s)`
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
                        {daySlots.map((slot) => (
                          <li
                            key={`${day}-${slot.weekday}-${slot.hour}`}
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
            </>
          )}
          {selectedDay !== null && (byDay[selectedDay] ?? []).length > 0 ? (
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
                aria-labelledby="mp-diet-day-modal-title"
              >
                <header className="mp-routine-day-modal-head">
                  <h2 id="mp-diet-day-modal-title" className="mp-routine-day-modal-title">
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
                    Deslizá horizontalmente para ver cada comida del día.
                  </p>
                  <div className="mp-routine-exercise-strip">
                    {(byDay[selectedDay] ?? []).map((slot) => {
                      const { head, detail } = splitHeadDetail(slot.event);
                      const dishText =
                        (slot.dish ?? '').trim() || (detail?.trim() ? detail : '');
                      const ingredients = slot.ingredients ?? [];
                      return (
                        <article
                          key={`${slot.weekday}-${slot.hour}`}
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
        </>
      ) : (
        !loadError && <p className="muted">Cargando plan…</p>
      )}
    </section>
  );
}
