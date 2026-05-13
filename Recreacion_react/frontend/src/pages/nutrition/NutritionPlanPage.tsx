import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { routes } from '../../config/member-management';
import { memberPortalRoutes } from '../../config/member-portal';
import { api } from '../../lib/api';
import { extractApiMessage } from '../../lib/extract-api-message';
import { useAuth } from '../../context/AuthContext';
import './nutrition-plan-grid.css';

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

function formatHour12(h: number): string {
  if (h === 0) return '12 am';
  if (h < 12) return `${h} am`;
  if (h === 12) return '12 pm';
  return `${h - 12} pm`;
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

type MembersListPayload = {
  members: Array<{
    id: number;
    first_name: string | null;
    last_name: string | null;
  }>;
};

function gridFromSlots(slots: ScheduleSlotApi[]): Record<string, string> {
  const next: Record<string, string> = {};
  for (const s of slots) {
    if (s.hour < GRID_FIRST_HOUR || s.hour > GRID_LAST_HOUR) continue;
    next[slotKey(s.weekday, s.hour)] = s.event ?? '';
  }
  return next;
}

function slotsFromGrid(grid: Record<string, string>): ScheduleSlotApi[] {
  const out: ScheduleSlotApi[] = [];
  for (let uiCol = 0; uiCol < 7; uiCol += 1) {
    const wd = uiColToApiWeekday(uiCol);
    for (const hour of VISIBLE_HOURS) {
      const event = (grid[slotKey(wd, hour)] ?? '').trim();
      if (event) out.push({ weekday: wd, hour, event });
    }
  }
  return out;
}

export function NutritionPlanPage() {
  const { memberId: memberIdParam } = useParams<{ memberId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const isCreateRoute = memberIdParam === undefined;

  const [membersOptions, setMembersOptions] = useState<
    MembersListPayload['members']
  >([]);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [titleName, setTitleName] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  /** Texto libre por celda (día API + hora). */
  const [grid, setGrid] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const effectiveMemberId = useMemo(() => {
    if (!isCreateRoute && memberIdParam) {
      const n = parseInt(memberIdParam, 10);
      return Number.isNaN(n) ? null : n;
    }
    return selectedMemberId;
  }, [isCreateRoute, memberIdParam, selectedMemberId]);

  const filledCount = useMemo(
    () => Object.values(grid).filter((t) => t.trim().length > 0).length,
    [grid],
  );

  const loadPlan = useCallback((mid: number) => {
    setLoadError(null);
    api
      .get<{ plan: PlanPayload | null }>(`/nutrition/members/${mid}/plan`)
      .then(({ data }) => {
        const p = data.plan;
        if (!p) return;
        const nm = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
        setTitleName(nm || `Socio #${p.member_id}`);
        setValidFrom(p.valid_from ?? '');
        setValidTo(p.valid_to ?? '');
        setGrid(gridFromSlots(p.schedule_slots ?? []));
      })
      .catch((e: unknown) =>
        setLoadError(extractApiMessage(e) || 'No se pudo cargar la dieta.'),
      );
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const r = user.role_name?.trim().toLowerCase() ?? '';
    if (r === 'member') {
      navigate(memberPortalRoutes.wellness, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    api
      .get<MembersListPayload>('/members')
      .then(({ data }) => setMembersOptions(data.members ?? []))
      .catch(() => setMembersOptions([]));
  }, [user]);

  useEffect(() => {
    if (!isCreateRoute && memberIdParam) {
      const mid = parseInt(memberIdParam, 10);
      if (Number.isNaN(mid)) {
        setLoadError('Identificador de socio inválido.');
        return;
      }
      setSelectedMemberId(mid);
      loadPlan(mid);
      return;
    }
    const q = searchParams.get('socio');
    if (q) {
      const mid = parseInt(q, 10);
      if (!Number.isNaN(mid)) {
        setSelectedMemberId(mid);
        loadPlan(mid);
      }
    }
  }, [isCreateRoute, memberIdParam, searchParams, loadPlan]);

  function onMemberChange(idStr: string) {
    if (!idStr) {
      setSelectedMemberId(null);
      setTitleName('');
      setGrid({});
      setValidFrom('');
      setValidTo('');
      return;
    }
    const mid = parseInt(idStr, 10);
    setSelectedMemberId(mid);
    const row = membersOptions.find((m) => m.id === mid);
    const nm = row
      ? [row.first_name, row.last_name].filter(Boolean).join(' ').trim()
      : '';
    setTitleName(nm || `Socio #${mid}`);
    loadPlan(mid);
  }

  function setCell(weekday: number, hour: number, value: string) {
    const k = slotKey(weekday, hour);
    setGrid((prev) => {
      const next = { ...prev };
      if (!value.trim()) delete next[k];
      else next[k] = value;
      return next;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!effectiveMemberId) {
      setSaveError('Selecciona el socio.');
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      const schedule_slots = slotsFromGrid(grid);
      await api.put(`/nutrition/members/${effectiveMemberId}/plan`, {
        valid_from: validFrom || undefined,
        valid_to: validTo || undefined,
        schedule_slots,
      });
      navigate(routes.nutricion);
    } catch (err: unknown) {
      setSaveError(extractApiMessage(err) || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function onDeletePlan() {
    if (!effectiveMemberId) return;
    if (
      !confirm(
        '¿Eliminar por completo la dieta de este socio? Esta acción no se puede deshacer.',
      )
    ) {
      return;
    }
    setSaveError(null);
    try {
      await api.delete(`/nutrition/members/${effectiveMemberId}/plan`);
      navigate(routes.nutricion);
    } catch (err: unknown) {
      setSaveError(extractApiMessage(err) || 'No se pudo eliminar.');
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
    <div className="mm-page">
      <header className="mm-page-head">
        <div>
          <h1>{isCreateRoute ? 'Nueva dieta' : 'Editar dieta'}</h1>
          <p className="muted">
            Semana tipo de <strong>5:00 a 23:00</strong>: escribe directamente en
            cada celda el evento de alimentación (comida, ingredientes con gramos,
            preparación). Al guardar, todo se almacena en la base como un solo
            arreglo JSON por dieta (día + hora + texto).
          </p>
        </div>
        <Link to={routes.nutricion} className="btn-outline">
          Volver al listado
        </Link>
      </header>

      {loadError ? <p className="login-error">{loadError}</p> : null}
      {saveError ? <p className="login-error">{saveError}</p> : null}

      <form className="member-form" onSubmit={(e) => void onSubmit(e)}>
        <section className="home-card member-form-section">
          <h2 className="member-detail-h2">Socio asignado</h2>
          {isCreateRoute ? (
            <div className="member-form-grid">
              <label className="member-form-span2">
                Miembro (la dieta es exclusiva de un solo socio)
                <select
                  value={selectedMemberId ?? ''}
                  onChange={(e) => onMemberChange(e.target.value)}
                  required={isCreateRoute}
                >
                  <option value="">— Seleccionar socio —</option>
                  {membersOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {[m.first_name, m.last_name].filter(Boolean).join(' ') ||
                        `#${m.id}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <p>
              <strong>{titleName || `Socio #${effectiveMemberId ?? ''}`}</strong>
            </p>
          )}
        </section>

        <section className="home-card member-form-section">
          <h2 className="member-detail-h2">Vigencia del plan</h2>
          <div className="member-form-grid">
            <label>
              Desde
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </label>
            <label>
              Hasta
              <input
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="home-card member-form-section">
          <h2 className="member-detail-h2">Semana tipo</h2>
          <p className="muted nutrition-cal-legend">
            Celdas editables: una por cada hora y día. Franjas vacías no se guardan.
            Ahora mismo hay <strong>{filledCount}</strong> franja
            {filledCount === 1 ? '' : 's'} con texto.
          </p>
          <div className="nutrition-cal-wrap">
            <table className="nutrition-cal-grid nutrition-cal-grid--editable">
              <thead>
                <tr>
                  <th className="nutrition-cal-corner">Hora</th>
                  {UI_DAY_LABELS.map((lab) => (
                    <th key={lab}>{lab}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VISIBLE_HOURS.map((hour) => (
                  <tr key={hour}>
                    <td className="nutrition-cal-time">
                      <span className="nutrition-cal-hour-label">
                        {formatHourLabel(hour)}
                      </span>
                      <span className="muted" style={{ fontSize: '0.72rem' }}>
                        {' '}
                        ({formatHour12(hour)})
                      </span>
                    </td>
                    {UI_DAY_LABELS.map((_, uiCol) => {
                      const wd = uiColToApiWeekday(uiCol);
                      const value = grid[slotKey(wd, hour)] ?? '';
                      return (
                        <td key={uiCol} className="nutrition-cal-cell">
                          <textarea
                            className="nutrition-cal-cell-textarea"
                            rows={4}
                            value={value}
                            disabled={!effectiveMemberId}
                            placeholder={
                              effectiveMemberId
                                ? 'Evento: comida, ingredientes (g), preparación…'
                                : 'Elige socio primero'
                            }
                            onChange={(ev) =>
                              setCell(wd, hour, ev.target.value)
                            }
                            aria-label={`${UI_DAY_LABELS[uiCol]} ${formatHourLabel(hour)}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="member-form-actions">
          <button
            type="button"
            className="btn-outline"
            onClick={() => void onDeletePlan()}
            disabled={!effectiveMemberId}
          >
            Eliminar dieta
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || !effectiveMemberId}
          >
            {saving ? 'Guardando…' : 'Guardar plan'}
          </button>
        </div>
      </form>
    </div>
  );
}
