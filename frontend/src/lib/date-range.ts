import { addDaysIso, parseIsoDateLocal } from './date-iso';

export type DateRangeField = 'from' | 'to';

/** Mínimo permitido para «hasta»: el día siguiente a «desde». */
export function minHastaAfterDesde(desde: string): string | undefined {
  if (!desde) return undefined;
  return addDaysIso(desde, 1);
}

/** Máximo permitido para «desde»: el día anterior a «hasta». */
export function maxDesdeBeforeHasta(hasta: string): string | undefined {
  if (!hasta) return undefined;
  return addDaysIso(hasta, -1);
}

/** Corrige «hasta» si no es estrictamente posterior a «desde». */
export function normalizeDateRange(
  desde: string,
  hasta: string,
): { desde: string; hasta: string } {
  if (!desde || !hasta) return { desde, hasta };
  const fromD = parseIsoDateLocal(desde);
  const toD = parseIsoDateLocal(hasta);
  if (fromD && toD && fromD >= toD) {
    return { desde, hasta: addDaysIso(desde, 1) };
  }
  return { desde, hasta };
}

export function applyDateRangeChange(
  desde: string,
  hasta: string,
  field: DateRangeField,
  value: string,
): { desde: string; hasta: string } {
  const nextDesde = field === 'from' ? value : desde;
  const nextHasta = field === 'to' ? value : hasta;
  return normalizeDateRange(nextDesde, nextHasta);
}

export function bindDateRange(
  desde: string,
  hasta: string,
  setDesde: (v: string) => void,
  setHasta: (v: string) => void,
) {
  return {
    desde,
    hasta,
    minHasta: minHastaAfterDesde(desde),
    maxDesde: maxDesdeBeforeHasta(hasta),
    onDesdeChange: (value: string) => {
      const next = applyDateRangeChange(desde, hasta, 'from', value);
      setDesde(next.desde);
      setHasta(next.hasta);
    },
    onHastaChange: (value: string) => {
      const next = applyDateRangeChange(desde, hasta, 'to', value);
      setDesde(next.desde);
      setHasta(next.hasta);
    },
    setBoth: (nextDesde: string, nextHasta: string) => {
      const next = normalizeDateRange(nextDesde, nextHasta);
      setDesde(next.desde);
      setHasta(next.hasta);
    },
  };
}
