import { Injectable } from '@nestjs/common';
import type { GymMember } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import {
  CLUB_ROLES,
  type ClubRoleName,
  normalizeClubRole,
} from '../../../domain/club/club-roles';
import type { GymMemberReadRepository } from '../../../application/ports/gym-member-read.port';

@Injectable()
export class PrismaGymMemberReadRepository implements GymMemberReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countByRole(role: ClubRoleName): Promise<number> {
    const rows = await this.prisma.gymMember.findMany({
      select: { role_name: true },
    });
    return rows.filter((r) => normalizeClubRole(r.role_name) === role).length;
  }

  async countActiveMembers(): Promise<number> {
    const rows = await this.prisma.gymMember.findMany({
      where: { activated: 1 },
      select: { role_name: true },
    });
    return rows.filter(
      (r) => normalizeClubRole(r.role_name) === CLUB_ROLES.MEMBER,
    ).length;
  }

  async findById(id: number): Promise<GymMember | null> {
    return this.prisma.gymMember.findUnique({ where: { id } });
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
