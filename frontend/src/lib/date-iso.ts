import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parsea YYYY-MM-DD en hora local (sin desfase UTC). */
export function parseIsoDateLocal(iso: string): Date | undefined {
  if (!ISO_DATE_RE.test(iso)) return undefined;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return isValid(date) ? date : undefined;
}

export function toIsoDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateDisplay(iso: string): string {
  const date = parseIsoDateLocal(iso);
  if (!date) return '';
  return format(date, 'd/M/yyyy', { locale: es });
}

export function addDaysIso(iso: string, days: number): string {
  const date = parseIsoDateLocal(iso);
  if (!date) return '';
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return toIsoDateLocal(next);
}
