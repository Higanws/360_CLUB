import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { GymMember, TrainingAssignment } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { normalizeClubRole } from '../shared/domain/club/club-roles';
import { staffMustUseOwnMembersOnly } from '../shared/application/security/staff-member-scope';
import {
  buildPageMeta,
  paginationSkip,
  type PaginatedMeta,
} from '../shared/dto/paginated-meta';
import { CreateTrainingAssignmentDto } from './dto/create-training-assignment.dto';

type AssignmentWithRelations = TrainingAssignment & {
  routine?: { title: string } | null;
  members?: Array<{ member_id: number; member: GymMember | null }>;
  trainers?: Array<{ trainer_member_id: number; trainer: GymMember | null }>;
};

function memberDisplayName(m: GymMember | null | undefined): string {
  if (!m) return '—';
  const parts = [m.first_name, m.last_name].filter(Boolean).join(' ').trim();
  if (parts) return parts;
  return m.username ?? `ID ${m.id}`;
}

@Injectable()
export class TrainingAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private canViewAssignment(
    a: AssignmentWithRelations,
    actor: { userId: number; role_name: string },
  ): boolean {
    const ar = normalizeClubRole(actor.role_name);
    if (ar === 'administrator') return true;
    if (ar !== 'staff_member') return false;
    if (!staffMustUseOwnMembersOnly(actor)) return true;
    const trainers = a.trainers ?? [];
    if (trainers.some((t) => t.trainer_member_id === actor.userId)) {
      return true;
    }
    const members = a.members ?? [];
    return members.some((m) => m.member?.assign_staff_mem === actor.userId);
  }

  async list(
    actor: { userId: number; role_name: string },
    page = 1,
    pageSize = 25,
    q?: string,
    memberId?: number,
    trainerId?: number,
  ): Promise<{
    assignments: Array<{
      id: number;
      routine_id: number;
      routine_title: string;
      member_ids: number[];
      member_names: string[];
      trainer_names: string[];
      created_at: string;
    }>;
    meta: PaginatedMeta;
  }> {
    const ps = Math.min(100, Math.max(1, pageSize));
    const pg = Math.max(1, page);

    const conditions: Prisma.Sql[] = [];
    if (staffMustUseOwnMembersOnly(actor)) {
      conditions.push(
        Prisma.sql`(t.trainer_member_id = ${actor.userId} OR gm.assign_staff_mem = ${actor.userId})`,
      );
    }
    if (memberId != null && memberId > 0) {
      conditions.push(Prisma.sql`am.member_id = ${memberId}`);
    }
    if (trainerId != null && trainerId > 0) {
      conditions.push(Prisma.sql`t.trainer_member_id = ${trainerId}`);
    }
    const qTrim = q?.trim();
    if (qTrim) {
      const like = `%${qTrim.replace(/[%_\\]/g, '\\$&')}%`;
      conditions.push(
        Prisma.sql`(r.title LIKE ${like} OR gm.first_name LIKE ${like} OR gm.last_name LIKE ${like} OR CAST(gm.id AS CHAR) LIKE ${like})`,
      );
    }
    const whereSql =
      conditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
        : Prisma.empty;

    const baseFrom = Prisma.sql`
      FROM training_assignment a
      LEFT JOIN training_assignment_trainer t ON t.assignment_id = a.id
      LEFT JOIN training_assignment_member am ON am.assignment_id = a.id
      LEFT JOIN gym_member gm ON gm.id = am.member_id
      LEFT JOIN training_routine r ON r.id = a.routine_id
      ${whereSql}
    `;

    const totalRows = await this.prisma.$queryRaw<Array<{ cnt: bigint | number }>>`
      SELECT COUNT(DISTINCT a.id) AS cnt ${baseFrom}
    `;
    const total = Number(totalRows[0]?.cnt ?? 0);

    const idRows = await this.prisma.$queryRaw<Array<{ id: number | bigint }>>`
      SELECT DISTINCT a.id AS id ${baseFrom}
      ORDER BY a.id DESC
      LIMIT ${ps} OFFSET ${paginationSkip(pg, ps)}
    `;

    const idList = idRows.map((r) => Number(r.id)).filter((id) => id > 0);
    if (!idList.length) {
      return { assignments: [], meta: buildPageMeta(total, pg, ps) };
    }

    const rows = (await this.prisma.trainingAssignment.findMany({
      where: { id: { in: idList } },
      include: {
        routine: true,
        members: { include: { member: true } },
        trainers: { include: { trainer: true } },
      },
      orderBy: { id: 'desc' },
    })) as AssignmentWithRelations[];

    const byId = new Map(rows.map((a) => [a.id, a]));
    const ordered = idList
      .map((id) => byId.get(id))
      .filter((a): a is AssignmentWithRelations => a != null);

    return {
      assignments: ordered.map((a) => ({
        id: a.id,
        routine_id: a.routine_id,
        routine_title: a.routine?.title ?? '',
        member_ids: (a.members ?? []).map((m) => m.member_id),
        member_names: (a.members ?? []).map((m) =>
          memberDisplayName(m.member),
        ),
        trainer_names: (a.trainers ?? []).map((t) =>
          memberDisplayName(t.trainer),
        ),
        created_at:
          a.created_at instanceof Date
            ? a.created_at.toISOString()
            : String(a.created_at),
      })),
      meta: buildPageMeta(total, pg, ps),
    };
  }

  async getOne(
    id: number,
    actor: { userId: number; role_name: string },
  ) {
    const a = (await this.prisma.trainingAssignment.findUnique({
      where: { id },
      include: {
        routine: true,
        members: { include: { member: true } },
        trainers: { include: { trainer: true } },
      },
    })) as AssignmentWithRelations | null;
    if (!a) throw new NotFoundException('Asignación no encontrada.');
    if (!this.canViewAssignment(a, actor)) {
      throw new ForbiddenException('No tienes acceso a esta asignación.');
    }
    return {
      id: a.id,
      routine_id: a.routine_id,
      routine_title: a.routine?.title ?? '',
      member_ids: (a.members ?? []).map((m) => m.member_id),
      trainer_member_ids: (a.trainers ?? []).map((t) => t.trainer_member_id),
      members: (a.members ?? []).map((m) => ({
        member_id: m.member_id,
        first_name: m.member?.first_name ?? null,
        last_name: m.member?.last_name ?? null,
        username: m.member?.username ?? null,
      })),
      trainers: (a.trainers ?? []).map((t) => ({
        trainer_member_id: t.trainer_member_id,
        first_name: t.trainer?.first_name ?? null,
        last_name: t.trainer?.last_name ?? null,
        username: t.trainer?.username ?? null,
      })),
      created_at:
        a.created_at instanceof Date
          ? a.created_at.toISOString()
          : String(a.created_at),
    };
  }

  async create(
    dto: CreateTrainingAssignmentDto,
    actor: { userId: number; role_name: string },
  ) {
    const routine = await this.prisma.trainingRoutine.findUnique({
      where: { id: dto.routine_id },
    });
    if (!routine) throw new BadRequestException('Rutina no encontrada.');

    const memberIds = [...new Set(dto.member_ids)];
    const trainerIds = [...new Set(dto.trainer_member_ids)];

    await this.assertMembers(memberIds, actor);
    await this.assertTrainers(trainerIds, actor);

    const saved = await this.prisma.trainingAssignment.create({
      data: { routine_id: dto.routine_id },
    });

    await this.prisma.trainingAssignmentMember.createMany({
      data: memberIds.map((member_id) => ({
        assignment_id: saved.id,
        member_id,
      })),
    });
    await this.prisma.trainingAssignmentTrainer.createMany({
      data: trainerIds.map((trainer_member_id) => ({
        assignment_id: saved.id,
        trainer_member_id,
      })),
    });

    return this.getOne(saved.id, actor);
  }

  async remove(
    id: number,
    actor: { userId: number; role_name: string },
  ): Promise<void> {
    await this.getOne(id, actor);
    try {
      await this.prisma.trainingAssignment.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Asignación no encontrada.');
    }
  }

  private async assertMembers(
    ids: number[],
    actor: { userId: number; role_name: string },
  ): Promise<void> {
    const rows = await this.prisma.gymMember.findMany({
      where: { id: { in: ids } },
    });
    if (rows.length !== ids.length) {
      throw new BadRequestException('Algún socio no existe.');
    }
    for (const m of rows) {
      if (normalizeClubRole(m.role_name) !== 'member') {
        throw new BadRequestException(`El usuario ${m.id} no es un socio.`);
      }
    }
    if (staffMustUseOwnMembersOnly(actor)) {
      for (const m of rows) {
        if (m.assign_staff_mem !== actor.userId) {
          throw new ForbiddenException(
            'Solo puedes asignar rutinas a socios que te están asignados.',
          );
        }
      }
    }
  }

  private async assertTrainers(
    ids: number[],
    actor: { userId: number; role_name: string },
  ): Promise<void> {
    const ar = normalizeClubRole(actor.role_name);
    if (ar === 'staff_member') {
      for (const id of ids) {
        if (id !== actor.userId) {
          throw new ForbiddenException(
            'Solo puedes incluirte a ti mismo como entrenador en la asignación.',
          );
        }
      }
    }
    const rows = await this.prisma.gymMember.findMany({
      where: { id: { in: ids } },
    });
    if (rows.length !== ids.length) {
      throw new BadRequestException('Algún entrenador no existe.');
    }
    for (const m of rows) {
      if (normalizeClubRole(m.role_name) !== 'staff_member') {
        throw new BadRequestException(
          `El usuario ${m.id} no es miembro del personal entrenador.`,
        );
      }
    }
  }
}
