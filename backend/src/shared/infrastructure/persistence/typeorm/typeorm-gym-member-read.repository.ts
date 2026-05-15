import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CLUB_ROLES,
  type ClubRoleName,
  normalizeClubRole,
} from '../../../domain/club/club-roles';
import type { GymMemberReadRepository } from '../../../application/ports/gym-member-read.port';
import { GymMember } from '../../../../entities/gym-member.entity';

@Injectable()
export class TypeOrmGymMemberReadRepository implements GymMemberReadRepository {
  constructor(
    @InjectRepository(GymMember)
    private readonly members: Repository<GymMember>,
  ) {}

  async countByRole(role: ClubRoleName): Promise<number> {
    return this.members
      .createQueryBuilder('m')
      .where('LOWER(TRIM(m.role_name)) = :role', { role })
      .getCount();
  }

  async countActiveMembers(): Promise<number> {
    return this.members
      .createQueryBuilder('m')
      .where('LOWER(TRIM(m.role_name)) = :role', { role: CLUB_ROLES.MEMBER })
      .andWhere('m.activated = 1')
      .getCount();
  }

  async findById(id: number): Promise<GymMember | null> {
    return this.members.findOne({ where: { id } });
  }

  async findByIdAndRole(
    id: number,
    role: ClubRoleName,
  ): Promise<GymMember | null> {
    const m = await this.findById(id);
    if (!m || normalizeClubRole(m.role_name) !== role) return null;
    return m;
  }
}
