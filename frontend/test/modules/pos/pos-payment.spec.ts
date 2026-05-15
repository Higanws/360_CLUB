import { posPaymentLabel } from '../../../src/lib/pos-payment';

describe('pos / pos-payment', () => {
  it('resuelve etiquetas de método de pago', () => {
    expect(posPaymentLabel('efectivo')).toBe('Efectivo');
    expect(posPaymentLabel('desconocido')).toBe('desconocido');
  });
});
