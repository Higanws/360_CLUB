/** Moneda por defecto del club (pesos argentinos). */
export const APP_CURRENCY = 'ARS';
export const APP_LOCALE = 'es-AR';

const moneyFormatter = new Intl.NumberFormat(APP_LOCALE, {
  style: 'currency',
  currency: APP_CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Símbolo corto para inputs (ej. $ en ARS). */
export function currencySymbol(): string {
  const parts = new Intl.NumberFormat(APP_LOCALE, {
    style: 'currency',
    currency: APP_CURRENCY,
    currencyDisplay: 'narrowSymbol',
  }).formatToParts(0);
  return parts.find((p) => p.type === 'currency')?.value ?? '$';
}

export function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return moneyFormatter.format(0);
  return moneyFormatter.format(n);
}

export function formatMoneyOptional(
  n: number | null | undefined,
): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return formatMoney(n);
}

/** Etiqueta de formulario, ej. "Precio ($)". */
export function currencyFieldLabel(base: string): string {
  return `${base} (${currencySymbol()})`;
}
