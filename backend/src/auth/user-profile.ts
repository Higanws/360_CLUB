import type { GymMember } from '@prisma/client';
import { normalizeClubRole } from '../shared/domain/club/club-roles';

/** Perfil expuesto al cliente tras login /auth/me (sin datos sensibles de gestión). */
export type UserProfileDto = {
  id: number;
  username: string | null;
  role_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  specialization_ids: number[];
  specializations: { id: number; name: string }[];
};

export function toUserProfileDto(
  member: Pick<
    GymMember,
    'id' | 'username' | 'role_name' | 'first_name' | 'last_name' | 'email'
  >,
  specs: { id: number; name: string }[] = [],
): UserProfileDto {
  const role = normalizeClubRole(member.role_name);
  const specialization_ids = specs.map((s) => s.id);
  const specializations = specs;
  if (role === 'member') {
    return {
      id: member.id,
      username: member.username,
      role_name: member.role_name,
      first_name: member.first_name,
      last_name: member.last_name,
      email: null,
      specialization_ids: [],
      specializations: [],
    };
  }
  return {
    id: member.id,
    username: member.username,
    role_name: member.role_name,
    first_name: member.first_name,
    last_name: member.last_name,
    email: member.email,
    specialization_ids,
    specializations,
  };
}
