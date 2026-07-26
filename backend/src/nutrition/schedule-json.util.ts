export type NutritionIngredientLine = {
  name: string;
  quantity: string;
};

export type NutritionScheduleSlot = {
  weekday: number;
  hour: number;
  /** Nombre corto de la franja (p. ej. «Desayuno»). */
  event: string;
  /** Qué platillo es (descripción). Opcional. */
  dish?: string | null;
  /** Ingredientes y cantidades para prepararlo. Opcional. */
  ingredients?: NutritionIngredientLine[] | null;
};

/** Parsea el JSON guardado en LONGTEXT o devuelto ya parseado por el driver. */
export function parseMealsScheduleJson(raw: unknown): NutritionScheduleSlot[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return normalizeSlotsArray(raw);
  if (Buffer.isBuffer(raw)) return parseString(String(raw.toString('utf8')));
  if (typeof raw === 'string') return parseString(raw);
  if (typeof raw === 'object') {
    try {
      return parseString(JSON.stringify(raw));
    } catch {
      return [];
    }
  }
  return parseString(String(raw));
}

function parseString(text: string): NutritionScheduleSlot[] {
  const t = text.trim();
  if (!t || t === 'null') return [];
  try {
    const p = JSON.parse(t) as unknown;
    return Array.isArray(p) ? normalizeSlotsArray(p) : [];
  } catch {
    return [];
  }
}

function normalizeIngredientLine(
  o: Record<string, unknown>,
): NutritionIngredientLine | null {
  const name = String(o.name ?? o.ingredient ?? o.item ?? '').trim();
  const quantity = String(o.quantity ?? o.qty ?? o.amount ?? '').trim();
  if (!name) return null;
  return {
    name: name.slice(0, 200),
    quantity: quantity.slice(0, 200),
  };
}

function normalizeIngredients(raw: unknown): NutritionIngredientLine[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  const out: NutritionIngredientLine[] = [];
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue;
    const line = normalizeIngredientLine(x as Record<string, unknown>);
    if (line) out.push(line);
    if (out.length >= 100) break;
  }
  return out.length ? out : null;
}

function normalizeSlotsArray(arr: unknown[]): NutritionScheduleSlot[] {
  const out: NutritionScheduleSlot[] = [];
  for (const x of arr) {
    if (!x || typeof x !== 'object') continue;
    const o = x as Record<string, unknown>;
    const wd = Number(o.weekday);
    const hour = Number(o.hour);
    const event = String(o.event ?? '').trim();
    if (!Number.isInteger(wd) || wd < 0 || wd > 6) continue;
    if (!Number.isInteger(hour) || hour < 5 || hour > 23) continue;
    if (!event) continue;
    const dishRaw = o.dish != null ? String(o.dish).trim() : '';
    const dish = dishRaw ? dishRaw.slice(0, 4000) : null;
    const ingredients = normalizeIngredients(o.ingredients);
    out.push({
      weekday: wd,
      hour,
      event: event.slice(0, 8000),
      dish,
      ingredients,
    });
  }
  return dedupeNutritionSlots(out);
}

export function dedupeNutritionSlots(
  slots: NutritionScheduleSlot[],
): NutritionScheduleSlot[] {
  const m = new Map<string, NutritionScheduleSlot>();
  for (const s of slots) {
    m.set(`${s.weekday}-${s.hour}`, s);
  }
  return [...m.values()].sort((a, b) =>
    a.weekday !== b.weekday ? a.weekday - b.weekday : a.hour - b.hour,
  );
}

export function stringifyMealsScheduleJson(
  slots: NutritionScheduleSlot[] | null | undefined,
): string | null {
  if (slots == null || !Array.isArray(slots) || slots.length === 0) return null;
  return JSON.stringify(dedupeNutritionSlots(slots));
}
