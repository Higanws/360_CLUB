/** Bitmask: lunes=1 … domingo=64 (orden ISO habitual en España: L–D). */
export const ROUTINE_WEEKDAY_BITS = [1, 2, 4, 8, 16, 32, 64] as const;

export const ROUTINE_WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

export const ROUTINE_WEEKDAYS_ALL_MASK = 127;

export function hasRoutineWeekday(mask: number, bit: number): boolean {
  return (mask & bit) !== 0;
}

/** Alterna un día; no deja la máscara en 0 (siempre al menos un día). */
export function toggleRoutineWeekday(mask: number, bit: number): number {
  const next = mask ^ bit;
  if (next === 0) return mask;
  return next & 127;
}
