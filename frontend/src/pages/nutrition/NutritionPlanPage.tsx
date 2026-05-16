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
import { fetchAllMembersLiteRows } from '../../lib/members-api';
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

type IngredientLine = { name: string; quantity: string };

type ScheduleSlotApi = {
  weekday: number;
  hour: number;
  event: string;
  dish?: string | null;
  ingredients?: IngredientLine[] | null;
};

type CellPayload = {
  event: string;
  dish: string;
  ingredients: IngredientLine[];
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

function emptyCell(): CellPayload {
  return { event: '', dish: '', ingredients: [] };
}

function cellMapFromSlots(slots: ScheduleSlotApi[]): Record<string, CellPayload> {
  const next: Record<string, CellPayload> = {};
  for (const s of slots) {
    if (s.hour < GRID_FIRST_HOUR || s.hour > GRID_LAST_HOUR) continue;
    const k = slotKey(s.weekday, s.hour);
    const ing = Array.isArray(s.ingredients)
      ? s.ingredients
          .filter((x) => x && String(x.name ?? '').trim())
          .map((x) => ({
            name: String(x.name ?? '').trim(),
            quantity: String(x.quantity ?? '').trim(),
          }))
      : [];
    next[k] = {
      event: s.event ?? '',
      dish: (s.dish ?? '').trim(),
      ingredients: ing.length ? ing : [],
    };
  }
  return next;
}

function slotsFromCellMap(map: Record<string, CellPayload>): ScheduleSlotApi[] {
  const out: ScheduleSlotApi[] = [];
  for (let uiCol = 0; uiCol < 7; uiCol += 1) {
    const wd = uiColToApiWeekday(uiCol);
    for (const hour of VISIBLE_HOURS) {
      const k = slotKey(wd, hour);
      const cell = map[k];
      const event = (cell?.event ?? '').trim();
      if (!event) continue;
      const dish = (cell.dish ?? '').trim();
      const ingredients = (cell.ingredients ?? [])
        .map((x) => ({
          name: String(x.name ?? '').trim(),
          quantity: String(x.quantity ?? '').trim(),
        }))
        .filter((x) => x.name.length > 0);
      const slot: ScheduleSlotApi = { weekday: wd, hour, event };
      if (dish) slot.dish = dish;
      if (ingredients.length) slot.ingredients = ingredients;
      out.push(slot);
    }
  }
  return out;
}

function cellHasExtra(cell: CellPayload | undefined): boolean {
  if (!cell) return false;
  if (cell.dish.trim()) return true;
  return cell.ingredients.some((i) => i.name.trim() || i.quantity.trim());
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
  const [cellMap, setCellMap] = useState<Record<string, CellPayload>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [detailModal, setDetailModal] = useState<{
    wd: number;
    hour: number;
    uiLabel: string;
  } | null>(null);
  const [detailDraft, setDetailDraft] = useState<CellPayload | null>(null);

  const effectiveMemberId = useMemo(() => {
    if (!isCreateRoute && memberIdParam) {
      const n = parseInt(memberIdParam, 10);
      return Number.isNaN(n) ? null : n;
    }
    return selectedMemberId;
  }, [isCreateRoute, memberIdParam, selectedMemberId]);

  const filledCount = useMemo(
    () =>
      Object.values(cellMap).filter((c) => (c?.event ?? '').trim().length > 0)
        .length,
    [cellMap],
  );

  const loadPlan = useCallback((mid: number) => {
    setLoadError(null);
    setDetailModal(null);
    setDetailDraft(null);
    api
      .get<{ plan: PlanPayload | null }>(`/nutrition/members/${mid}/plan`)
      .then(({ data }) => {
        const p = data.plan;
        if (!p) return;
        const nm = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
        setTitleName(nm || `Socio #${p.member_id}`);
        setValidFrom(p.valid_from ?? '');
        setValidTo(p.valid_to ?? '');
        setCellMap(cellMapFromSlots(p.schedule_slots ?? []));
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
    fetchAllMembersLiteRows(200)
      .then((rows) => setMembersOptions(rows))
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
      setCellMap({});
      setValidFrom('');
      setValidTo('');
      setDetailModal(null);
      setDetailDraft(null);
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

  function setCellEvent(weekday: number, hour: number, value: string) {
    const k = slotKey(weekday, hour);
    setCellMap((prev) => {
      const next = { ...prev };
      const cur = next[k] ?? emptyCell();
      if (!value.trim()) {
        delete next[k];
        return next;
      }
      next[k] = { ...cur, event: value };
      return next;
    });
  }

  function openDetail(wd: number, hour: number, uiLabel: string) {
    const k = slotKey(wd, hour);
    const base = { ...(cellMap[k] ?? emptyCell()) };
    if (!base.ingredients.length) {
      base.ingredients = [{ name: '', quantity: '' }];
    }
    setDetailDraft(base);
    setDetailModal({ wd, hour, uiLabel });
  }

  function saveDetail() {
    if (!detailModal || !detailDraft) return;
    const { wd, hour } = detailModal;
    const k = slotKey(wd, hour);
    const event = detailDraft.event.trim();
    const dish = detailDraft.dish.trim();
    const ingredients = detailDraft.ingredients
      .map((x) => ({
        name: x.name.trim(),
        quantity: x.quantity.trim(),
      }))
      .filter((x) => x.name.length > 0);

    setCellMap((prev) => {
      const next = { ...prev };
      if (!event) {
        delete next[k];
        return next;
      }
      next[k] = {
        event: detailDraft.event,
        dish,
        ingredients,
      };
      return next;
    });
    setDetailModal(null);
    setDetailDraft(null);
  }

  function cancelDetail() {
    setDetailModal(null);
    setDetailDraft(null);
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
      const schedule_slots = slotsFromCellMap(cellMap);
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

  useEffect(() => {
    if (detailModal === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelDetail();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [detailModal]);

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
            Semana tipo de <strong>5:00 a 23:00</strong>: en cada celda el <strong>nombre breve</strong>{' '}
            de la comida. Usá <strong>«Platillo e ingredientes»</strong> para describir el platillo y
            listar ingredientes con cantidades; se guardan en el mismo JSON del plan.
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
            Celdas con nombre de franja; las vacías no se guardan. Hay{' '}
            <strong>{filledCount}</strong> franja{filledCount === 1 ? '' : 's'} con nombre.
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
                      const k = slotKey(wd, hour);
                      const cell = cellMap[k] ?? emptyCell();
                      const value = cell.event;
                      const extra = cellHasExtra(cell);
                      return (
                        <td key={uiCol} className="nutrition-cal-cell">
                          <textarea
                            className="nutrition-cal-cell-textarea"
                            rows={3}
                            value={value}
                            disabled={!effectiveMemberId}
                            placeholder={
                              effectiveMemberId
                                ? 'Nombre de la comida (ej. Desayuno proteico)'
                                : 'Elige socio primero'
                            }
                            onChange={(ev) => setCellEvent(wd, hour, ev.target.value)}
                            aria-label={`${UI_DAY_LABELS[uiCol]} ${formatHourLabel(hour)}`}
                          />
                          <div className="nutrition-cal-cell-tools">
                            <button
                              type="button"
                              className="btn-outline nutrition-cal-detail-btn"
                              disabled={!effectiveMemberId}
                              onClick={() =>
                                openDetail(wd, hour, UI_DAY_LABELS[uiCol])
                              }
                            >
                              Platillo e ingredientes
                              {extra ? ' ●' : ''}
                            </button>
                          </div>
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

      {detailModal && detailDraft ? (
        <div
          className="mp-routine-day-modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) cancelDetail();
          }}
        >
          <div
            className="mp-routine-day-modal-panel nutrition-plan-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nutrition-plan-detail-title"
          >
            <header className="mp-routine-day-modal-head">
              <h2 id="nutrition-plan-detail-title" className="mp-routine-day-modal-title">
                {detailModal.uiLabel} · {formatHourLabel(detailModal.hour)}
              </h2>
              <button
                type="button"
                className="mp-routine-day-modal-close"
                aria-label="Cerrar"
                onClick={cancelDetail}
              >
                ×
              </button>
            </header>
            <div className="nutrition-plan-detail-body">
              <label className="nutrition-plan-detail-label">
                Nombre de la franja (visible en el calendario y en el portal)
                <input
                  type="text"
                  className="nutrition-plan-detail-input"
                  value={detailDraft.event}
                  onChange={(e) =>
                    setDetailDraft((d) =>
                      d ? { ...d, event: e.target.value } : d,
                    )
                  }
                />
              </label>
              <label className="nutrition-plan-detail-label">
                Platillo (qué es y cómo se prepara)
                <textarea
                  className="nutrition-plan-detail-textarea"
                  rows={4}
                  value={detailDraft.dish}
                  onChange={(e) =>
                    setDetailDraft((d) =>
                      d ? { ...d, dish: e.target.value } : d,
                    )
                  }
                  placeholder="Ej.: Bowl de yogur griego con avena y frutos rojos, servido frío."
                />
              </label>
              <div className="nutrition-plan-detail-ingredients">
                <span className="pay-manual-label">Ingredientes y cantidades</span>
                {detailDraft.ingredients.map((row, idx) => (
                  <div key={idx} className="nutrition-plan-ingredient-row">
                    <input
                      type="text"
                      className="nutrition-plan-detail-input"
                      placeholder="Ingrediente"
                      value={row.name}
                      onChange={(e) =>
                        setDetailDraft((d) => {
                          if (!d) return d;
                          const ingredients = d.ingredients.map((x, j) =>
                            j === idx ? { ...x, name: e.target.value } : x,
                          );
                          return { ...d, ingredients };
                        })
                      }
                    />
                    <input
                      type="text"
                      className="nutrition-plan-detail-input"
                      placeholder="Cantidad (ej. 150 g)"
                      value={row.quantity}
                      onChange={(e) =>
                        setDetailDraft((d) => {
                          if (!d) return d;
                          const ingredients = d.ingredients.map((x, j) =>
                            j === idx ? { ...x, quantity: e.target.value } : x,
                          );
                          return { ...d, ingredients };
                        })
                      }
                    />
                    <button
                      type="button"
                      className="btn-outline btn-table btn-table--danger"
                      onClick={() =>
                        setDetailDraft((d) => {
                          if (!d) return d;
                          const ingredients = d.ingredients.filter((_, j) => j !== idx);
                          return {
                            ...d,
                            ingredients:
                              ingredients.length > 0
                                ? ingredients
                                : [{ name: '', quantity: '' }],
                          };
                        })
                      }
                    >
                      Quitar
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() =>
                    setDetailDraft((d) =>
                      d
                        ? {
                            ...d,
                            ingredients: [
                              ...d.ingredients,
                              { name: '', quantity: '' },
                            ],
                          }
                        : d,
                    )
                  }
                >
                  Añadir ingrediente
                </button>
              </div>
              <div className="nutrition-plan-detail-actions">
                <button type="button" className="btn-outline" onClick={cancelDetail}>
                  Cancelar
                </button>
                <button type="button" className="btn-primary" onClick={saveDetail}>
                  Guardar franja
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
