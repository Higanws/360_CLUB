import {
  CLUB_ROLES,
  isAdministratorRole,
  isBusinessRole,
  isMemberRole,
  isStaffRole,
  normalizeClubRole,
} from '../../../src/shared/domain/club/club-roles';

describe('club-roles (infra/domain)', () => {
  it('normalizeClubRole recorta y pasa a minúsculas', () => {
    expect(normalizeClubRole('  Member ')).toBe('member');
    expect(normalizeClubRole(null)).toBe('');
  });

  it('helpers de rol', () => {
    expect(isMemberRole(CLUB_ROLES.MEMBER)).toBe(true);
    expect(isStaffRole('staff_member')).toBe(true);
    expect(isAdministratorRole('Administrator')).toBe(true);
    expect(isBusinessRole('member')).toBe(false);
    expect(isBusinessRole('staff_member')).toBe(true);
  });
});
