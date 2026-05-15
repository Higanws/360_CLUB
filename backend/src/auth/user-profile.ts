import { GymMember } from '../entities/gym-member.entity';
import { normalizeClubRole } from '../shared/domain/club/club-roles';

/** Perfil expuesto al cliente tras login /auth/me (sin datos sensibles de gestión). */
export type UserProfileDto = {
  id: number;
  username: string | null;
  role_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

export function toUserProfileDto(member: GymMember): UserProfileDto {
  const role = normalizeClubRole(member.role_name);
  if (role === 'member') {
    return {
      id: member.id,
      username: member.username,
      role_name: member.role_name,
      first_name: member.first_name,
      last_name: member.last_name,
      email: null,
    };
  }
  return {
    id: member.id,
    username: member.username,
    role_name: member.role_name,
    first_name: member.first_name,
    last_name: member.last_name,
    email: member.email,
  };
}
