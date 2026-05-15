import { toIsoDateOnly } from '../../../src/shared/domain/shared/iso-date';

describe('iso-date (infra/domain)', () => {
  it('formatea Date a YYYY-MM-DD', () => {
    expect(toIsoDateOnly(new Date('2026-05-15T12:00:00.000Z'))).toBe('2026-05-15');
  });

  it('recorta strings largos', () => {
    expect(toIsoDateOnly('2026-01-02T00:00:00')).toBe('2026-01-02');
  });

  it('devuelve null para vacío', () => {
    expect(toIsoDateOnly(null)).toBeNull();
    expect(toIsoDateOnly(undefined)).toBeNull();
  });
});
