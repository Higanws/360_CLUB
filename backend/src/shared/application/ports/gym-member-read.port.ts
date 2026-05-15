import type { ClubRoleName } from '../../domain/club/club-roles';
import type { GymMember } from '../../../entities/gym-member.entity';

/** Lectura de socios/personal — puerto de persistencia (adaptador TypeORM). */
export interface GymMemberReadRepository {
  countByRole(role: ClubRoleName): Promise<number>;
  countActiveMembers(): Promise<number>;
  findById(id: number): Promise<GymMember | null>;
  findByIdAndRole(id: number, role: ClubRoleName): Promise<GymMember | null>;
}

export const GYM_MEMBER_READ = Symbol('GYM_MEMBER_READ');
