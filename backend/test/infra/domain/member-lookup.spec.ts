import { normalizeMemberLookupToken } from '../../../src/shared/domain/club/member-lookup';

describe('member-lookup (infra/domain)', () => {
  it('normaliza carnet a mayúsculas sin espacios', () => {
    expect(normalizeMemberLookupToken('  ab 12 ')).toBe('AB12');
  });
});
