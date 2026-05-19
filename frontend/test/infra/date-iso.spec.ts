import { describe, expect, it } from 'vitest';
import {
  formatDateDisplay,
  parseIsoDateLocal,
  toIsoDateLocal,
} from '../../src/lib/date-iso';

describe('date-iso', () => {
  it('round-trips YYYY-MM-DD in local time', () => {
    const date = new Date(2026, 4, 19);
    const iso = toIsoDateLocal(date);
    expect(iso).toBe('2026-05-19');
    expect(parseIsoDateLocal(iso)?.getDate()).toBe(19);
  });

  it('formats for display in es-AR style', () => {
    expect(formatDateDisplay('2026-05-01')).toBe('1/5/2026');
  });

  it('rejects invalid iso strings', () => {
    expect(parseIsoDateLocal('')).toBeUndefined();
    expect(parseIsoDateLocal('19-05-2026')).toBeUndefined();
  });
});
