/** weekday: 0=domingo … 6=sábado */
const WEEKDAY_NAMES: Record<string, number> = {
  domingo: 0,
  dom: 0,
  sunday: 0,
  sun: 0,
  lunes: 1,
  lun: 1,
  monday: 1,
  mon: 1,
  martes: 2,
  mar: 2,
  tuesday: 2,
  tue: 2,
  miercoles: 3,
  miércoles: 3,
  mie: 3,
  mié: 3,
  wednesday: 3,
  wed: 3,
  jueves: 4,
  jue: 4,
  thursday: 4,
  thu: 4,
  viernes: 5,
  vie: 5,
  friday: 5,
  fri: 5,
  sabado: 6,
  sábado: 6,
  sab: 6,
  sáb: 6,
  saturday: 6,
  sat: 6,
};

const WEEKDAY_LABELS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

export function parseWeekday(input: string | number | undefined): number | null {
  if (input === undefined || input === null || input === '') return null;
  if (typeof input === 'number' && input >= 0 && input <= 6) return input;
  const s = String(input).trim().toLowerCase();
  if (/^\d$/.test(s)) {
    const n = Number(s);
    return n >= 0 && n <= 6 ? n : null;
  }
  return WEEKDAY_NAMES[s] ?? null;
}

export function weekdayLabel(weekday: number): string {
  return WEEKDAY_LABELS[weekday] ?? String(weekday);
}

export function resolveWeekday(
  weekday?: number,
  weekdayName?: string,
): number {
  const fromName = weekdayName ? parseWeekday(weekdayName) : null;
  if (fromName !== null) return fromName;
  if (weekday !== undefined && weekday >= 0 && weekday <= 6) return weekday;
  throw new Error(
    'Indicá weekday (0-6) o weekday_name (ej. "lunes"). Ver club360://guide/nutrition-model',
  );
}
