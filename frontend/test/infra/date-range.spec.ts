import { describe, expect, it } from 'vitest';
import {
  applyDateRangeChange,
  minHastaAfterDesde,
  normalizeDateRange,
} from '../../src/lib/date-range';

describe('date-range', () => {
  it('exige que hasta sea al menos un día después de desde', () => {
    expect(minHastaAfterDesde('2026-05-01')).toBe('2026-05-02');
    expect(
      applyDateRangeChange('2026-05-10', '2026-05-12', 'from', '2026-05-15'),
    ).toEqual({ desde: '2026-05-15', hasta: '2026-05-16' });
    expect(
      applyDateRangeChange('2026-05-10', '2026-05-12', 'to', '2026-05-08'),
    ).toEqual({ desde: '2026-05-10', hasta: '2026-05-11' });
  });

  it('normaliza datos cargados inválidos', () => {
    expect(
      normalizeDateRange('2026-06-01', '2026-06-01'),
    ).toEqual({ desde: '2026-06-01', hasta: '2026-06-02' });
    expect(
      normalizeDateRange('2026-06-01', '2026-06-15'),
    ).toEqual({ desde: '2026-06-01', hasta: '2026-06-15' });
  });
});
