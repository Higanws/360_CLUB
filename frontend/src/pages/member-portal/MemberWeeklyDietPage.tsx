import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { extractApiMessage } from '../../lib/extract-api-message';
import {
  isPortalPreviewRole,
} from '../../lib/member-wellness-params';
import { useAuth } from '../../context/AuthContext';
import '../nutrition/nutrition-plan-grid.css';

/** Columnas UI: 0=Lunes … 6=Domingo → API 1–6 Lun–Sáb, 0=Dom */
function uiColToApiWeekday(uiCol: number): number {
  if (uiCol === 6) return 0;
  return uiCol + 1;
}

const UI_DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const GRID_FIRST_HOUR = 5;
const GRID_LAST_HOUR = 23;
const VISIBLE_HOURS = Array.from(
  { length: GRID_LAST_HOUR - GRID_FIRST_HOUR + 1 },
  (_, i) => GRID_FIRST_HOUR + i,
);

function formatHourLabel(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

function slotKey(weekday: number, hour: number): string {
  return `${weekday}-${hour}`;
}

type ScheduleSlotApi = {
  weekday: number;
  hour: number;
  event: string;
};

type PlanPayload = {
  member_id: number;
  first_name: string | null;
  last_name: string | null;
  valid_from: string | null;
  valid_to: string | null;
  schedule_slots: ScheduleSlotApi[];
};

function gridFromSlots(slots: ScheduleSlotApi[]): Record<string, string> {
  const next: Record<string, string> = {};
  for (const s of slots) {
    if (s.hour < GRID_FIRST_HOUR || s.hour > GRID_LAST_HOUR) continue;
    next[slotKey(s.weekday, s.hour)] = s.event ?? '';
  }
  return next;
}

export function MemberWeeklyDietPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const miembro = searchParams.get('miembro');
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  const grid = useMemo(() => {
    if (!plan) return {};
    return gridFromSlots(plan.schedule_slots ?? []);
  }, [plan]);

  if (loading || !user) {
    return (
      <div className="mp-wellness">
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  if (needsPick) {
    return (
      <section className="mp-wellness-section">
        <h2 className="mp-wellness-section-title">Dieta de la semana</h2>
        <p className="muted">
          Usa la barra «Vista de socio» arriba para buscar y seleccionar un miembro. Así verás el
          mismo plan de comidas que él en el portal.
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
          {!plan.schedule_slots?.length ? (
            <p className="muted">
              Aún no hay comidas planificadas. Tu entrenador o nutricionista puede completar el plan
              desde gestión del club.
            </p>
          ) : (
            <div className="nutrition-cal-wrap">
              <table className="nutrition-cal-grid" aria-label="Plan de comidas semanal">
                <thead>
                  <tr>
                    <th className="nutrition-cal-corner" scope="col">
                      Hora
                    </th>
                    {UI_DAY_LABELS.map((label) => (
                      <th key={label} scope="col">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {VISIBLE_HOURS.map((hour) => (
                    <tr key={hour}>
                      <th className="nutrition-cal-time" scope="row">
                        {formatHourLabel(hour)}
                      </th>
                      {UI_DAY_LABELS.map((label, _uiCol) => {
                        const wd = uiColToApiWeekday(_uiCol);
                        const text = grid[slotKey(wd, hour)] ?? '';
                        return (
                          <td key={`${label}-${hour}`} className="nutrition-cal-cell">
                            <textarea
                              className="nutrition-cal-cell-textarea"
                              value={text}
                              readOnly
                              disabled
                              rows={3}
                              aria-label={`${label} ${formatHourLabel(hour)}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="muted nutrition-cal-legend">
            Vista solo lectura. Los mismos datos provienen del plan de nutrición (`meals_schedule_json`)
            gestionado por el personal del club.
          </p>
        </>
      ) : (
        !loadError && <p className="muted">Cargando plan…</p>
      )}
    </section>
  );
}
