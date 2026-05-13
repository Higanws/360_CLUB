export declare const POS_PAYMENT_METHODS: readonly ["efectivo", "tarjeta", "transferencia", "otro"];
export type PosPaymentMethod = (typeof POS_PAYMENT_METHODS)[number];
export declare function isPosPaymentMethod(v: string): v is PosPaymentMethod;
