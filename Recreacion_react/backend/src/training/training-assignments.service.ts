import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GymMember } from '../entities/gym-member.entity';
import { TrainingAssignment } from '../entities/training-assignment.entity';
import { TrainingAssignmentMember } from '../entities/training-assignment-member.entity';
import { TrainingAssignmentTrainer } from '../entities/training-assignment-trainer.entity';
import { TrainingRoutine } from '../entities/training-routine.entity';
import { CreateTrainingAssignmentDto } from './dto/create-training-assignment.dto';

function normRole(r: string | null | undefined): string {
  return (r ?? '').trim().toLowerCase();
}

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
  ) {}

  async list() {
    const rows = await this.assignments.find({
      relations: [
        'routine',
        'members',
        'members.member',
        'trainers',
        'trainers.trainer',
      ],
      order: { id: 'DESC' },
    });
    return rows.map((a) => ({
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
    }));
  }

  async getOne(id: number) {
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

    return this.getOne(saved.id);
  }

  async remove(id: number): Promise<void> {
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
      if (normRole(m.role_name) !== 'member') {
        throw new BadRequestException(`El usuario ${m.id} no es un socio.`);
      }
    }
    const ar = normRole(actor.role_name);
    if (ar === 'staff_member') {
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
    const ar = normRole(actor.role_name);
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
      if (normRole(m.role_name) !== 'staff_member') {
        throw new BadRequestException(
          `El usuario ${m.id} no es miembro del personal entrenador.`,
        );
      }
    }
  }
}
