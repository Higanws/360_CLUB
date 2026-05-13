/**
 * Semana laboral del portal socio: `week_start` es el **lunes** (DATE `YYYY-MM-DD`)
 * del calendario en zona **Europe/Madrid** (no UTC).
 */

function formatYmdMadrid(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function weekdayLongMadrid(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    weekday: 'long',
  }).format(d);
}

/** Encuentra un instante cuyo calendario en Madrid sea `ymd` (iteración por horas). */
export function instantForMadridYmd(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  let guess = new Date(Date.UTC(y, m - 1, d, 8, 0, 0));
  for (let i = 0; i < 48; i++) {
    if (formatYmdMadrid(guess) === ymd) return guess;
    guess = new Date(guess.getTime() + 3600000);
  }
  return null;
}

export function isMondayYmdInMadrid(ymd: string): boolean {
  const inst = instantForMadridYmd(ymd);
  if (!inst) return false;
  return weekdayLongMadrid(inst) === 'Monday';
}

/** Fecha calendario actual `YYYY-MM-DD` en Europe/Madrid (misma zona que el portal socio). */
export function todayYmdMadrid(ref: Date = new Date()): string {
  return formatYmdMadrid(ref);
}

/** `YYYY-MM-DD` del lunes de la semana que contiene `ref` en Madrid. */
export function madridMondayWeekStart(ref: Date = new Date()): string {
  let t = ref.getTime();
  for (let i = 0; i < 24 * 8; i++) {
    const d = new Date(t);
    if (weekdayLongMadrid(d) === 'Monday') {
      return formatYmdMadrid(d);
    }
    t -= 3600000;
  }
  return formatYmdMadrid(ref);
}
