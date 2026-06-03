export type NutritionIngredient = { name: string; quantity: string };

export type NutritionSlot = {
  weekday: number;
  hour: number;
  event: string;
  dish?: string | null;
  ingredients?: NutritionIngredient[] | null;
};

export type NutritionPlan = {
  member_id: number;
  valid_from?: string | null;
  valid_to?: string | null;
  schedule_slots: NutritionSlot[];
};

function slotKey(s: NutritionSlot): string {
  return `${s.weekday}:${s.hour}:${s.event.trim().toLowerCase()}`;
}

export function findSlot(
  slots: NutritionSlot[],
  opts: {
    weekday: number;
    hour?: number;
    mealEvent?: string;
  },
): NutritionSlot | undefined {
  const eventNeedle = opts.mealEvent?.trim().toLowerCase();
  return slots.find((s) => {
    if (s.weekday !== opts.weekday) return false;
    if (opts.hour !== undefined && s.hour !== opts.hour) return false;
    if (eventNeedle && !s.event.trim().toLowerCase().includes(eventNeedle)) {
      return false;
    }
    return true;
  });
}

export function upsertSlot(
  plan: NutritionPlan,
  slot: NutritionSlot,
): NutritionPlan {
  const slots = [...plan.schedule_slots];
  const idx = slots.findIndex(
    (s) =>
      s.weekday === slot.weekday &&
      s.hour === slot.hour &&
      s.event.trim().toLowerCase() === slot.event.trim().toLowerCase(),
  );
  if (idx >= 0) slots[idx] = slot;
  else slots.push(slot);
  return { ...plan, schedule_slots: slots };
}

export function updateMealInPlan(
  plan: NutritionPlan,
  opts: {
    weekday: number;
    hour?: number;
    mealEvent?: string;
    dish?: string;
    ingredients?: NutritionIngredient[];
  },
): NutritionPlan {
  const existing = findSlot(plan.schedule_slots, opts);
  if (!existing) {
    throw new Error(
      `No hay franja que coincida (weekday=${opts.weekday}, hour=${opts.hour ?? 'any'}, event=${opts.mealEvent ?? 'any'}). Usá nutrition_meal_add.`,
    );
  }
  const updated: NutritionSlot = {
    ...existing,
    dish: opts.dish !== undefined ? opts.dish : existing.dish,
    ingredients:
      opts.ingredients !== undefined ? opts.ingredients : existing.ingredients,
  };
  return upsertSlot(plan, updated);
}

export function addMealToPlan(
  plan: NutritionPlan,
  slot: NutritionSlot,
): NutritionPlan {
  const dup = findSlot(plan.schedule_slots, {
    weekday: slot.weekday,
    hour: slot.hour,
    mealEvent: slot.event,
  });
  if (dup) {
    throw new Error(
      'Ya existe una franja en ese día/hora/evento. Usá nutrition_meal_update.',
    );
  }
  return upsertSlot(plan, slot);
}

export function removeMealFromPlan(
  plan: NutritionPlan,
  opts: { weekday: number; hour?: number; mealEvent?: string },
): NutritionPlan {
  const before = plan.schedule_slots.length;
  const slots = plan.schedule_slots.filter((s) => {
    if (s.weekday !== opts.weekday) return true;
    if (opts.hour !== undefined && s.hour === opts.hour) return false;
    if (
      opts.mealEvent &&
      s.event.trim().toLowerCase().includes(opts.mealEvent.trim().toLowerCase())
    ) {
      return false;
    }
    if (opts.hour === undefined && !opts.mealEvent) return true;
    return true;
  });
  if (slots.length === before) {
    throw new Error('No se encontró la franja a eliminar.');
  }
  return { ...plan, schedule_slots: slots };
}

export function planToUpsertBody(plan: NutritionPlan) {
  return {
    valid_from: plan.valid_from ?? undefined,
    valid_to: plan.valid_to ?? undefined,
    schedule_slots: plan.schedule_slots,
  };
}
