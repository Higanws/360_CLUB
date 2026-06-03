import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GeneralSetting } from '../entities/general-setting.entity';
import { GymMember } from '../entities/gym-member.entity';
import { TrainingAssignment } from '../entities/training-assignment.entity';
import { TrainingAssignmentMember } from '../entities/training-assignment-member.entity';
import { TrainingAssignmentTrainer } from '../entities/training-assignment-trainer.entity';
import { TrainingRoutine } from '../entities/training-routine.entity';
import { normalizeClubRole } from '../shared/domain/club/club-roles';
import { staffMustUseOwnMembersOnly } from '../shared/application/security/staff-member-scope';
import {
  buildPageMeta,
  paginationSkip,
  type PaginatedMeta,
} from '../shared/dto/paginated-meta';
import { CreateTrainingAssignmentDto } from './dto/create-training-assignment.dto';

function memberDisplayName(m: GymMember | undefined): string {
  if (!m) return '—';
  const parts = [m.first_name, m.last_name].filter(Boolean).join(' ').trim();
  if (parts) return parts;
  return m.username ?? `ID ${m.id}`;
}

@Injectable()
export class TrainingAssignmentsService {
  constructor(
    @InjectRepository(TrainingAssignment)
    private readonly assignments: Repository<TrainingAssignment>,
    @InjectRepository(TrainingAssignmentMember)
    private readonly assignmentMembers: Repository<TrainingAssignmentMember>,
    @InjectRepository(TrainingAssignmentTrainer)
    private readonly assignmentTrainers: Repository<TrainingAssignmentTrainer>,
    @InjectRepository(TrainingRoutine)
    private readonly routines: Repository<TrainingRoutine>,
    @InjectRepository(GymMember)
    private readonly members: Repository<GymMember>,
    @InjectRepository(GeneralSetting)
    private readonly settings: Repository<GeneralSetting>,
  ) {}

  private canViewAssignment(
    a: TrainingAssignment,
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

    const baseQb = this.assignments
      .createQueryBuilder('a')
      .leftJoin('a.trainers', 't')
      .leftJoin('a.members', 'am')
      .leftJoin('am.member', 'gm')
      .leftJoin('a.routine', 'r');

    if (staffMustUseOwnMembersOnly(actor)) {
      baseQb.andWhere(
        '(t.trainer_member_id = :uid OR gm.assign_staff_mem = :uid)',
        { uid: actor.userId },
      );
    }
    if (memberId != null && memberId > 0) {
      baseQb.andWhere('am.member_id = :memberId', { memberId });
    }
    if (trainerId != null && trainerId > 0) {
      baseQb.andWhere('t.trainer_member_id = :trainerId', { trainerId });
    }
    const qTrim = q?.trim();
    if (qTrim) {
      const like = `%${qTrim.replace(/[%_\\]/g, '\\$&')}%`;
      baseQb.andWhere(
        `(r.title LIKE :like OR gm.first_name LIKE :like OR gm.last_name LIKE :like OR CAST(gm.id AS CHAR) LIKE :like)`,
        { like },
      );
    }

    const total = await baseQb
      .clone()
      .select('a.id')
      .distinct(true)
      .getCount();

    const idRows = await baseQb
      .clone()
      .select('a.id', 'id')
      .distinct(true)
      .orderBy('a.id', 'DESC')
      .offset(paginationSkip(pg, ps))
      .limit(ps)
      .getRawMany<{ id: number }>();

    const idList = idRows.map((r) => Number(r.id)).filter((id) => id > 0);
    if (!idList.length) {
      return { assignments: [], meta: buildPageMeta(total, pg, ps) };
    }

    const rows = await this.assignments.find({
      where: { id: In(idList) },
      relations: [
        'routine',
        'members',
        'members.member',
        'trainers',
        'trainers.trainer',
      ],
      order: { id: 'DESC' },
    });

    const byId = new Map(rows.map((a) => [a.id, a]));
    const ordered = idList
      .map((id) => byId.get(id))
      .filter((a): a is TrainingAssignment => a != null);

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
    const a = await this.assignments.findOne({
      where: { id },
      relations: [
        'routine',
        'members',
        'members.member',
        'trainers',
        'trainers.trainer',
      ],
    });
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
    const routine = await this.routines.findOne({ where: { id: dto.routine_id } });
    if (!routine) throw new BadRequestException('Rutina no encontrada.');

    const memberIds = [...new Set(dto.member_ids)];
    const trainerIds = [...new Set(dto.trainer_member_ids)];

    await this.assertMembers(memberIds, actor);
    await this.assertTrainers(trainerIds, actor);

    const row = this.assignments.create({
      routine: { id: dto.routine_id } as TrainingRoutine,
    });
    const saved = await this.assignments.save(row);

    await this.assignmentMembers.save(
      memberIds.map((member_id) =>
        this.assignmentMembers.create({
          assignment_id: saved.id,
          member_id,
        }),
      ),
    );
    await this.assignmentTrainers.save(
      trainerIds.map((trainer_member_id) =>
        this.assignmentTrainers.create({
          assignment_id: saved.id,
          trainer_member_id,
        }),
      ),
    );

    return this.getOne(saved.id, actor);
  }

  async remove(
    id: number,
    actor: { userId: number; role_name: string },
  ): Promise<void> {
    await this.getOne(id, actor);
    const res = await this.assignments.delete({ id });
    if (!res.affected) throw new NotFoundException('Asignación no encontrada.');
  }

  private async assertMembers(
    ids: number[],
    actor: { userId: number; role_name: string },
  ): Promise<void> {
    const rows = await this.members.findBy({ id: In(ids) });
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
    const rows = await this.members.findBy({ id: In(ids) });
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
