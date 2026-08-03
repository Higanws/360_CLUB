import { useCallback, useEffect, useMemo, useState } from 'react';
import { bindDateRange, normalizeDateRange } from '../../lib/date-range';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MmDatePicker } from '../../components/ui/MmDatePicker';
import { MmSelect } from '../../components/ui/MmSelect';
import { routes } from '../../config/member-management';
import { api } from '../../lib/api';
import { extractApiMessage } from '../../lib/extract-api-message';
import {
  emptyMealLine,
  formatNutritionHour,
  mealLinesToSlots,
  NUTRITION_HOUR_OPTIONS,
  slotsToMealLines,
  type MealLineForm,
} from '../../lib/nutrition-meals';
import {
  ROUTINE_WEEKDAY_BITS,
  ROUTINE_WEEKDAY_LABELS,
  hasRoutineWeekday,
  toggleRoutineWeekday,
} from '../../lib/training-weekdays';
import { useAuth } from '../../context/AuthContext';
import './nutrition-plan-grid.css';

type GeneralPlanPayload = {
  id: number;
  title: string;
  is_published: boolean;
  valid_from: string | null;
  valid_to: string | null;
  schedule_slots: import('../../lib/nutrition-meals').NutritionScheduleSlot[];
};

export function NutritionGeneralPlanPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [planTitle, setPlanTitle] = useState('Dieta general');
  const [isPublished, setIsPublished] = useState(true);
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [mealLines, setMealLines] = useState<MealLineForm[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(true);

  const filledMealCount = useMemo(
    () => mealLines.filter((m) => m.name.trim().length > 0).length,
    [mealLines],
  );

  const hourSelectOptions = useMemo(
    () =>
      NUTRITION_HOUR_OPTIONS.map((h) => ({
        value: String(h),
        label: formatNutritionHour(h),
      })),
    [],
  );

  const vigenciaRange = useMemo(
    () => bindDateRange(validFrom, validTo, setValidFrom, setValidTo),
    [validFrom, validTo],
  );

  const loadPlan = useCallback(() => {
    setLoadError(null);
    setLoadingPlan(true);
    api
      .get<{ plan: GeneralPlanPayload | null }>('/nutrition/general')
      .then(({ data }) => {
        const p = data.plan;
        if (!p) {
          setMealLines([]);
          setPlanTitle('Dieta general');
          setIsPublished(true);
          setValidFrom('');
          setValidTo('');
          return;
        }
        setPlanTitle(p.title || 'Dieta general');
        setIsPublished(p.is_published);
        const vigencia = normalizeDateRange(
          p.valid_from ?? '',
          p.valid_to ?? '',
        );
        setValidFrom(vigencia.desde);
        setValidTo(vigencia.hasta);
        const lines = slotsToMealLines(p.schedule_slots ?? []);
        setMealLines(lines.length ? lines : []);
      })
      .catch((e: unknown) =>
        setLoadError(extractApiMessage(e) || 'No se pudo cargar la dieta general.'),
      )
      .finally(() => setLoadingPlan(false));
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    loadPlan();
  }, [user, loadPlan]);

  function addMeal() {
    setMealLines((prev) => [...prev, emptyMealLine()]);
    setSaveError(null);
  }

  function removeMealAt(i: number) {
    setMealLines((prev) => prev.filter((_, j) => j !== i));
  }

  function moveMeal(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= mealLines.length) return;
    setMealLines((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  }

  function patchMealAt(i: number, patch: Partial<MealLineForm>) {
    setMealLines((prev) =>
      prev.map((line, j) => (j === i ? { ...line, ...patch } : line)),
    );
  }

  function toggleMealDayAt(i: number, bit: number) {
    setMealLines((prev) =>
      prev.map((line, j) =>
        j === i
          ? {
              ...line,
              weekdaysMask: toggleRoutineWeekday(line.weekdaysMask, bit),
            }
          : line,
      ),
    );
  }

  function addIngredientAt(mealIdx: number) {
    setMealLines((prev) =>
      prev.map((line, j) =>
        j === mealIdx
          ? {
              ...line,
              ingredients: [...line.ingredients, { name: '', quantity: '' }],
            }
          : line,
      ),
    );
  }

  function patchIngredientAt(
    mealIdx: number,
    ingIdx: number,
    patch: Partial<{ name: string; quantity: string }>,
  ) {
    setMealLines((prev) =>
      prev.map((line, j) => {
        if (j !== mealIdx) return line;
        const ingredients = line.ingredients.map((row, k) =>
          k === ingIdx ? { ...row, ...patch } : row,
        );
        return { ...line, ingredients };
      }),
    );
  }

  function removeIngredientAt(mealIdx: number, ingIdx: number) {
    setMealLines((prev) =>
      prev.map((line, j) => {
        if (j !== mealIdx) return line;
        const ingredients = line.ingredients.filter((_, k) => k !== ingIdx);
        return {
          ...line,
          ingredients:
            ingredients.length > 0
              ? ingredients
              : [{ name: '', quantity: '' }],
        };
      }),
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    const named = mealLines.filter((m) => m.name.trim().length > 0);
    if (named.length === 0) {
      setSaveError('Añade al menos una comida con nombre.');
      return;
    }

    for (const line of named) {
      if ((line.weekdaysMask & 127) < 1) {
        setSaveError(
          `«${line.name.trim()}» debe tener al menos un día de la semana.`,
        );
        return;
      }
    }

    setSaveError(null);
    setSaving(true);
    try {
      const schedule_slots = mealLinesToSlots(mealLines);
      await api.put('/nutrition/general', {
        title: planTitle.trim() || 'Dieta general',
        is_published: isPublished,
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

  if (loading || !user) {
    return (
      <div className="mm-page">
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="mm-page pay-manual-page">
      <header className="mm-page-head">
        <div>
          <h1>Dieta general del club</h1>
          <p className="muted">
            Plan compartido para socios con suscripción a nutrición general. Los planes
            personalizados por socio se gestionan aparte en «Planes por socio».
          </p>
        </div>
        <Link to={routes.nutricion} className="btn-outline">
          Volver al listado
        </Link>
      </header>

      {loadError ? <p className="login-error">{loadError}</p> : null}
      {saveError ? <p className="login-error">{saveError}</p> : null}
      {loadingPlan ? <p className="muted">Cargando plan…</p> : null}

      <form className="member-form" onSubmit={(e) => void onSubmit(e)}>
        <section className="home-card member-form-section">
          <h2 className="member-detail-h2">Datos del plan</h2>
          <div className="member-form-grid">
            <label className="member-form-span2">
              Título
              <input
                type="text"
                maxLength={200}
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
              />
            </label>
            <label className="member-form-checkbox">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              Publicado (visible en portal para socios suscritos)
            </label>
          </div>
        </section>

        <section className="home-card member-form-section">
          <h2 className="member-detail-h2">Vigencia del plan</h2>
          <div className="member-form-grid">
            <label>
              Desde
              <MmDatePicker
                value={vigenciaRange.desde}
                onChange={vigenciaRange.onDesdeChange}
                max={vigenciaRange.maxDesde}
                aria-label="Vigencia desde"
              />
            </label>
            <label>
              Hasta
              <MmDatePicker
                value={vigenciaRange.hasta}
                onChange={vigenciaRange.onHastaChange}
                min={vigenciaRange.minHasta}
                aria-label="Vigencia hasta"
              />
            </label>
          </div>
        </section>

        <section className="home-card member-form-section">
          <h2 className="member-detail-h2">Comidas del plan</h2>
          <p className="muted nutrition-cal-legend">
            Horario permitido: <strong>5:00 a 23:00</strong>. Hay{' '}
            <strong>{filledMealCount}</strong> comida
            {filledMealCount === 1 ? '' : 's'} con nombre.
          </p>

          <div className="members-toolbar" style={{ marginTop: '0.75rem' }}>
            <button type="button" className="btn-primary" onClick={addMeal}>
              + Añadir comida
            </button>
          </div>

          {mealLines.length === 0 ? (
            <p className="muted">Aún no hay comidas en el plan.</p>
          ) : (
            <ol className="routine-exercise-list nutrition-meal-list">
              {mealLines.map((line, i) => (
                <li key={line.clientId} className="routine-exercise-item nutrition-meal-item">
                  <label className="nutrition-meal-field">
                    <span className="pay-manual-label">
                      Nombre de la comida <span className="pay-req">*</span>
                    </span>
                    <input
                      type="text"
                      className="nutrition-plan-detail-input"
                      value={line.name}
                      placeholder="Ej. Desayuno proteico"
                      onChange={(e) => patchMealAt(i, { name: e.target.value })}
                    />
                  </label>

                  <label className="nutrition-meal-field">
                    <span className="pay-manual-label">Descripción del platillo</span>
                    <textarea
                      className="nutrition-plan-detail-textarea"
                      rows={3}
                      value={line.description}
                      placeholder="Qué es y cómo se prepara…"
                      onChange={(e) =>
                        patchMealAt(i, { description: e.target.value })
                      }
                    />
                  </label>

                  <label className="routine-weight-field">
                    <span className="muted small">Hora</span>
                    <MmSelect
                      value={String(line.hour)}
                      onValueChange={(v) =>
                        patchMealAt(i, { hour: parseInt(v, 10) })
                      }
                      options={hourSelectOptions}
                      aria-label={`Hora de ${line.name || 'comida'}`}
                    />
                  </label>

                  <div className="routine-weekdays-block">
                    <span className="muted small">Días</span>
                    <div
                      className="routine-weekday-row"
                      role="group"
                      aria-label={`Días para ${line.name || 'comida'}`}
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
                            onClick={() => toggleMealDayAt(i, bit)}
                            aria-pressed={on}
                            title={ROUTINE_WEEKDAY_LABELS[di] ?? ''}
                          >
                            {ROUTINE_WEEKDAY_LABELS[di]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="nutrition-plan-detail-ingredients nutrition-meal-ingredients">
                    <span className="pay-manual-label">Ingredientes y cantidades</span>
                    {line.ingredients.map((row, ingIdx) => (
                      <div key={ingIdx} className="nutrition-plan-ingredient-row">
                        <input
                          type="text"
                          className="nutrition-plan-detail-input"
                          placeholder="Ingrediente"
                          value={row.name}
                          onChange={(e) =>
                            patchIngredientAt(i, ingIdx, { name: e.target.value })
                          }
                        />
                        <input
                          type="text"
                          className="nutrition-plan-detail-input"
                          placeholder="Cantidad (ej. 150 g)"
                          value={row.quantity}
                          onChange={(e) =>
                            patchIngredientAt(i, ingIdx, {
                              quantity: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          className="btn-outline btn-table btn-table--danger"
                          onClick={() => removeIngredientAt(i, ingIdx)}
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => addIngredientAt(i)}
                    >
                      Añadir ingrediente
                    </button>
                  </div>

                  <div className="routine-exercise-actions">
                    <button
                      type="button"
                      className="btn-outline"
                      disabled={i === 0}
                      onClick={() => moveMeal(i, -1)}
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      className="btn-outline"
                      disabled={i === mealLines.length - 1}
                      onClick={() => moveMeal(i, 1)}
                    >
                      Bajar
                    </button>
                    <button
                      type="button"
                      className="btn-table btn-table--danger"
                      onClick={() => removeMealAt(i)}
                    >
                      Quitar comida
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="member-form-actions">
          <button type="submit" className="btn-primary" disabled={saving || loadingPlan}>
            {saving ? 'Guardando…' : 'Guardar dieta general'}
          </button>
        </div>
      </form>
    </div>
  );
}
