import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneralSetting } from '../entities/general-setting.entity';
import { GymMember } from '../entities/gym-member.entity';
import { MemberWeeklyRoutine } from '../entities/member-weekly-routine.entity';
import { NutritionPlan } from '../entities/nutrition-plan.entity';
import { TrainingAssignment } from '../entities/training-assignment.entity';
import { parseMealsScheduleJson } from '../nutrition/schedule-json.util';
import type { NutritionScheduleSlot } from '../nutrition/schedule-json.util';
import {
  isMondayYmdInMadrid,
  madridMondayWeekStart,
} from './madrid-week.util';
import { normalizeActivityDifficulty } from '../activities/activity-difficulty';
import { normalizeClubRole } from '../shared/domain/club/club-roles';
import { assertStaffOwnsMember } from '../shared/application/security/staff-member-scope';
import { toIsoDateOnly } from '../shared/domain/shared/iso-date';
export type NutritionPlanPayload = {
  member_id: number;
  first_name: string | null;
  last_name: string | null;
  valid_from: string | null;
  valid_to: string | null;
  schedule_slots: NutritionScheduleSlot[];
};

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

function dayKeysFromMask(mask: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    if ((mask & (1 << i)) !== 0) out.push(DAY_KEYS[i]);
  }
  return out;
}

type JwtActor = { userId: number; role_name: string };

@Injectable()
export class MemberWellnessService {
  constructor(
    @InjectRepository(GeneralSetting)
    private readonly settings: Repository<GeneralSetting>,
    @InjectRepository(GymMember)
    private readonly members: Repository<GymMember>,
    @InjectRepository(NutritionPlan)
    private readonly plans: Repository<NutritionPlan>,
    @InjectRepository(TrainingAssignment)
    private readonly assignments: Repository<TrainingAssignment>,
    @InjectRepository(MemberWeeklyRoutine)
    private readonly weeklyRows: Repository<MemberWeeklyRoutine>,
  ) {}

  private async settingsRow(): Promise<GeneralSetting | null> {
    return (
      (await this.settings.find({ take: 1, order: { id: 'ASC' } }))[0] ?? null
    );
  }

  private async assertStaffCanViewMember(
    actor: JwtActor,
    member: GymMember,
  ): Promise<void> {
    assertStaffOwnsMember(actor, member);
  }

  /**
   * Socio: siempre el usuario JWT. Administración/staff: `memberIdParam` obligatorio
   * y comprobación de acceso (misma lógica que nutrición / listado de socios).
   */
  private async resolveTargetMember(
    actor: JwtActor,
    memberIdParam: number | undefined,
  ): Promise<GymMember> {
    const role = normalizeClubRole(actor.role_name);
    if (role !== 'member' && role !== 'administrator' && role !== 'staff_member') {
      throw new ForbiddenException('No autorizado.');
    }

    if (role === 'member') {
      if (
        memberIdParam != null &&
        Number.isFinite(memberIdParam) &&
        memberIdParam !== actor.userId
      ) {
        throw new ForbiddenException(
          'No puedes consultar datos de otro socio.',
        );
      }
      const m = await this.members.findOne({ where: { id: actor.userId } });
      if (!m || normalizeClubRole(m.role_name) !== 'member') {
        throw new NotFoundException('Socio no encontrado.');
      }
      return m;
    }

    if (
      memberIdParam == null ||
      !Number.isFinite(memberIdParam) ||
      memberIdParam < 1
    ) {
      throw new BadRequestException(
        'Indica member_id en la petición (identificador numérico del socio en el club).',
      );
    }

    const m = await this.members.findOne({ where: { id: memberIdParam } });
    if (!m || normalizeClubRole(m.role_name) !== 'member') {
      throw new NotFoundException('Socio no encontrado.');
    }

    if (role === 'staff_member') {
      await this.assertStaffCanViewMember(actor, m);
    }

    return m;
  }

  async getMyNutritionPlan(
    actor: JwtActor,
    memberIdParam?: number,
  ): Promise<{ plan: NutritionPlanPayload }> {
    const m = await this.resolveTargetMember(actor, memberIdParam);
    const plan = await this.plans.findOne({
      where: { member_id: m.id },
    });
    if (!plan) {
      return {
        plan: {
          member_id: m.id,
          first_name: m.first_name,
          last_name: m.last_name,
          valid_from: null,
          valid_to: null,
          schedule_slots: [],
        },
      };
    }
    const schedule_slots = parseMealsScheduleJson(
      plan.meals_schedule_json as unknown,
    );
    return {
      plan: {
        member_id: m.id,
        first_name: m.first_name,
        last_name: m.last_name,
        valid_from: toIsoDateOnly(plan.valid_from as Date),
        valid_to: toIsoDateOnly(plan.valid_to as Date),
        schedule_slots,
      },
    };
  }

  async getMyTrainingContext(
    actor: JwtActor,
    memberIdParam?: number,
  ): Promise<{
    week_start_default: string;
    assignment: null | {
      id: number;
      routine_id: number;
      routine_title: string;
      created_at: string;
      lines: Array<{
        id: number;
        activity_id: number;
        title: string;
        description: string | null;
        difficulty_level: string;
        sort_order: number;
        weight_kg: number | null;
        weekdays_mask: number;
        day_keys: string[];
        videos: { id: number; url: string; sort_order: number }[];
      }>;
    };
  }> {
    const target = await this.resolveTargetMember(actor, memberIdParam);
    const week_start_default = madridMondayWeekStart();
    const a = await this.assignments
      .createQueryBuilder('a')
      .innerJoin('a.members', 'm', 'm.member_id = :uid', { uid: target.id })
      .leftJoinAndSelect('a.routine', 'r')
      .leftJoinAndSelect('r.lines', 'l')
      .leftJoinAndSelect('l.activity', 'act')
      .leftJoinAndSelect('act.videos', 'av')
      .orderBy('a.id', 'DESC')
      .addOrderBy('l.sort_order', 'ASC')
      .addOrderBy('l.id', 'ASC')
      .addOrderBy('av.sort_order', 'ASC')
      .addOrderBy('av.id', 'ASC')
      .take(1)
      .getOne();

    if (!a?.routine) {
      return { week_start_default, assignment: null };
    }

    const lines = [...(a.routine.lines ?? [])].sort((x, y) => {
      if (x.sort_order !== y.sort_order) return x.sort_order - y.sort_order;
      return x.id - y.id;
    });

    return {
      week_start_default,
      assignment: {
        id: a.id,
        routine_id: a.routine_id,
        routine_title: a.routine.title,
        created_at:
          a.created_at instanceof Date
            ? a.created_at.toISOString()
            : String(a.created_at),
        lines: lines.map((l) => {
          const vids = [...(l.activity?.videos ?? [])].sort((x, y) => {
            if (x.sort_order !== y.sort_order) return x.sort_order - y.sort_order;
            return x.id - y.id;
          });
          return {
            id: l.id,
            activity_id: l.activity_id,
            title: l.activity?.title ?? `Ejercicio ${l.activity_id}`,
            description: l.activity?.description ?? null,
            difficulty_level: normalizeActivityDifficulty(
              l.activity?.difficulty_level,
            ),
            sort_order: l.sort_order,
            weight_kg: l.weight_kg ?? null,
            weekdays_mask: l.weekdays_mask,
            day_keys: dayKeysFromMask(l.weekdays_mask),
            videos: vids.map((v) => ({
              id: v.id,
              url: v.url,
              sort_order: v.sort_order,
            })),
          };
        }),
      },
    };
  }

  async getWeeklyRoutine(
    actor: JwtActor,
    weekStartParam?: string,
    memberIdParam?: number,
  ): Promise<{
    week_start: string;
    routine_snapshot_json: Record<string, unknown> | null;
    updated_at: string | null;
  }> {
    const target = await this.resolveTargetMember(actor, memberIdParam);
    const week_start = weekStartParam?.trim()
      ? weekStartParam.trim()
      : madridMondayWeekStart();
    if (!isMondayYmdInMadrid(week_start)) {
      throw new BadRequestException(
        'week_start debe ser un lunes (calendario Europe/Madrid).',
      );
    }
    const row = await this.weeklyRows.findOne({
      where: { member_id: target.id, week_start },
    });
    return {
      week_start,
      routine_snapshot_json: row?.routine_snapshot_json ?? null,
      updated_at: row?.updated_at
        ? row.updated_at instanceof Date
          ? row.updated_at.toISOString()
          : String(row.updated_at)
        : null,
    };
  }

}
