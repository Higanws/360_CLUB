/** Roles de negocio en `gym_member.role_name` (alineado con seed / PHP). */
export const CLUB_ROLES = {
  ADMINISTRATOR: 'administrator',
  STAFF: 'staff_member',
  MEMBER: 'member',
} as const;

export type ClubRoleName = (typeof CLUB_ROLES)[keyof typeof CLUB_ROLES];

export function normalizeClubRole(
  role: string | null | undefined,
): string {
  return (role ?? '').trim().toLowerCase();
}

export function isMemberRole(role: string | null | undefined): boolean {
  return normalizeClubRole(role) === CLUB_ROLES.MEMBER;
}

export function isStaffRole(role: string | null | undefined): boolean {
  return normalizeClubRole(role) === CLUB_ROLES.STAFF;
}

export function isAdministratorRole(role: string | null | undefined): boolean {
  return normalizeClubRole(role) === CLUB_ROLES.ADMINISTRATOR;
}

export function isBusinessRole(role: string | null | undefined): boolean {
  const r = normalizeClubRole(role);
  return r === CLUB_ROLES.ADMINISTRATOR || r === CLUB_ROLES.STAFF;
}
