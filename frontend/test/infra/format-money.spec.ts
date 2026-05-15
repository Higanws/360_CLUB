import {
  APP_CURRENCY,
  currencyFieldLabel,
  currencySymbol,
  formatMoney,
  formatMoneyOptional,
} from '../../src/lib/format-money';

describe('format-money (infra)', () => {
  it('usa ARS y locale es-AR', () => {
    expect(APP_CURRENCY).toBe('ARS');
    expect(formatMoney(1500)).toContain('1');
    expect(currencySymbol().length).toBeGreaterThan(0);
  });

  it('formatMoneyOptional maneja null', () => {
    expect(formatMoneyOptional(null)).toBe('—');
    expect(formatMoneyOptional(100)).not.toBe('—');
  });

  it('currencyFieldLabel añade símbolo', () => {
    expect(currencyFieldLabel('Precio')).toMatch(/^Precio \(/);
  });
});
