/** Valores persistidos en `pos_sale.payment_method` */
export const POS_PAYMENT_METHODS = [
  'efectivo',
  'tarjeta',
  'transferencia',
  'otro',
] as const;

export type PosPaymentMethod = (typeof POS_PAYMENT_METHODS)[number];

export function isPosPaymentMethod(v: string): v is PosPaymentMethod {
  return (POS_PAYMENT_METHODS as readonly string[]).includes(v);
}
