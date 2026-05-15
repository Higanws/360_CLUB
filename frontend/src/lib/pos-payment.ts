/** Coincide con backend `POS_PAYMENT_METHODS` */
export const POS_PAYMENT_OPTIONS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'otro', label: 'Otro' },
] as const;

export function posPaymentLabel(key: string | null | undefined): string {
  const k = (key ?? 'efectivo').trim().toLowerCase();
  const hit = POS_PAYMENT_OPTIONS.find((o) => o.value === k);
  return hit?.label ?? key ?? '—';
}
