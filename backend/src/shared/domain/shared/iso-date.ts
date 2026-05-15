/** Fecha calendario ISO `YYYY-MM-DD` desde Date o string de BD. */
export function toIsoDateOnly(
  value: Date | string | null | undefined,
): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : null;
}
