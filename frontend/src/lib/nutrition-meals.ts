import {
  ROUTINE_WEEKDAY_BITS,
  ROUTINE_WEEKDAYS_ALL_MASK,
  hasRoutineWeekday,
} from './training-weekdays';

export type IngredientLine = { name: string; quantity: string };

export type NutritionScheduleSlot = {
  weekday: number;
  hour: number;
  event: string;
  dish?: string | null;
  ingredients?: IngredientLine[] | null;
};

/** Una comida en el editor (como un ejercicio en rutina). */
export type MealLineForm = {
  clientId: string;
  name: string;
  description: string;
  ingredients: IngredientLine[];
  hour: number;
  weekdaysMask: number;
};

export const NUTRITION_HOUR_MIN = 5;
export const NUTRITION_HOUR_MAX = 23;

export const NUTRITION_HOUR_OPTIONS = Array.from(
  { length: NUTRITION_HOUR_MAX - NUTRITION_HOUR_MIN + 1 },
  (_, i) => NUTRITION_HOUR_MIN + i,
);

export function formatNutritionHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

/** API: 0=domingo, 1=lunes … 6=sábado → bitmask rutina (L=1 … D=64). */
export function nutritionWeekdayToBit(weekday: number): number {
  if (weekday === 0) return 64;
  if (weekday >= 1 && weekday <= 6) return ROUTINE_WEEKDAY_BITS[weekday - 1]!;
  return 0;
}

/** Bitmask rutina → weekday API. */
export function routineBitToNutritionWeekday(bit: number): number {
  const i = ROUTINE_WEEKDAY_BITS.indexOf(
    bit as (typeof ROUTINE_WEEKDAY_BITS)[number],
  );
  if (i < 0) return 1;
  return i === 6 ? 0 : i + 1;
}

function normalizeIngredients(
  raw: IngredientLine[] | null | undefined,
): IngredientLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => ({
      name: String(x.name ?? '').trim(),
      quantity: String(x.quantity ?? '').trim(),
    }))
    .filter((x) => x.name.length > 0);
}

function mealGroupKey(s: NutritionScheduleSlot): string {
  const ing = JSON.stringify(normalizeIngredients(s.ingredients ?? []));
  return `${s.event}\0${s.hour}\0${(s.dish ?? '').trim()}\0${ing}`;
}

export function newMealLineId(): string {
  return `meal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyMealLine(hour = 8): MealLineForm {
  return {
    clientId: newMealLineId(),
    name: '',
    description: '',
    ingredients: [{ name: '', quantity: '' }],
    hour,
    weekdaysMask: ROUTINE_WEEKDAYS_ALL_MASK,
  };
}

/** Agrupa slots del API en líneas del editor. */
export function slotsToMealLines(slots: NutritionScheduleSlot[]): MealLineForm[] {
  const map = new Map<
    string,
    {
      name: string;
      description: string;
      ingredients: IngredientLine[];
      hour: number;
      weekdaysMask: number;
    }
  >();

  for (const s of slots) {
    if (s.hour < NUTRITION_HOUR_MIN || s.hour > NUTRITION_HOUR_MAX) continue;
    const event = (s.event ?? '').trim();
    if (!event) continue;

    const key = mealGroupKey(s);
    const bit = nutritionWeekdayToBit(s.weekday);
    if (!bit) continue;

    const existing = map.get(key);
    if (existing) {
      existing.weekdaysMask |= bit;
    } else {
      map.set(key, {
        name: event,
        description: (s.dish ?? '').trim(),
        ingredients: normalizeIngredients(s.ingredients),
        hour: s.hour,
        weekdaysMask: bit,
      });
    }
  }

  return [...map.values()]
    .sort((a, b) => a.hour - b.hour || a.name.localeCompare(b.name, 'es'))
    .map((row) => ({
      clientId: newMealLineId(),
      ...row,
      ingredients: row.ingredients.length
        ? row.ingredients
        : [{ name: '', quantity: '' }],
    }));
}

/** Expande líneas del editor a `schedule_slots` del API. */
export function mealLinesToSlots(lines: MealLineForm[]): NutritionScheduleSlot[] {
  const out: NutritionScheduleSlot[] = [];

  for (const line of lines) {
    const event = line.name.trim();
    if (!event) continue;

    const hour = line.hour;
    if (hour < NUTRITION_HOUR_MIN || hour > NUTRITION_HOUR_MAX) continue;

    const mask = line.weekdaysMask & 127;
    if (mask < 1) continue;

    const dish = line.description.trim();
    const ingredients = normalizeIngredients(line.ingredients);

    for (const bit of ROUTINE_WEEKDAY_BITS) {
      if (!hasRoutineWeekday(mask, bit)) continue;
      const weekday = routineBitToNutritionWeekday(bit);
      const slot: NutritionScheduleSlot = { weekday, hour, event };
      if (dish) slot.dish = dish;
      if (ingredients.length) slot.ingredients = ingredients;
      out.push(slot);
    }
  }

  return out.sort((a, b) =>
    a.weekday !== b.weekday ? a.weekday - b.weekday : a.hour - b.hour,
  );
}
