import {
  isPosPaymentMethod,
  POS_PAYMENT_METHODS,
} from '../../../src/pos/payment-method';

describe('pos / payment-method', () => {
  it('valida métodos de pago POS', () => {
    expect(POS_PAYMENT_METHODS).toContain('efectivo');
    expect(isPosPaymentMethod('tarjeta')).toBe(true);
    expect(isPosPaymentMethod('bitcoin')).toBe(false);
  });
});
