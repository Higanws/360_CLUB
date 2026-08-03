import { formatMemberCode } from '../../../src/shared/domain/club/member-code';

describe('club / formatMemberCode', () => {
  it('usa prefijo M + id + día + año (2 dígitos)', () => {
    expect(formatMemberCode(5, new Date(2026, 7, 3))).toBe('M50326');
    expect(formatMemberCode(3, new Date(2026, 0, 15))).toBe('M31526');
    expect(formatMemberCode(4, new Date(2026, 0, 15))).toBe('M41526');
  });
});
