import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { GymMember } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { NutritionGeneralPayload } from '../nutrition/nutrition.service';
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

export type { NutritionGeneralPayload };

export type RoutineLinePayload = {
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
};

export type RoutineBlock = {
  id: number;
  routine_id: number;
  routine_title: string;
  created_at: string;
  lines: RoutineLinePayload[];
};

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

function dayKeysFromMask(mask: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    if ((mask & (1 << i)) !== 0) out.push(DAY_KEYS[i]);
  }
  return out;
}

function parseRoutineSnapshotJson(
  raw: string | null | undefined,
): Record<string, unknown> | null {
  if (raw == null || raw === '') return null;
  const t = String(raw).trim();
  if (!t) return null;
  try {
    const p = JSON.parse(t) as unknown;
    return typeof p === 'object' && p !== null
      ? (p as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

type JwtActor = { userId: number; role_name: string };

type RoutineLineWithActivity = {
  id: number;
  activity_id: number;
  sort_order: number;
  weight_kg: number | null;
  weekdays_mask: number;
  activity?: {
    title?: string | null;
    description?: string | null;
    difficulty_level?: string | null;
    videos?: Array<{ id: number; url: string; sort_order: number }>;
  } | null;
};

@Injectable()
export class MemberWellnessService {
  constructor(private readonly prisma: PrismaService) {}

  private mapRoutineLines(
    lines: RoutineLineWithActivity[],
  ): RoutineLinePayload[] {
    const sorted = [...lines].sort((x, y) => {
      if (x.sort_order !== y.sort_order) return x.sort_order - y.sort_order;
      return x.id - y.id;
    });
    return sorted.map((l) => {
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
    });
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
      const m = await this.prisma.gymMember.findUnique({
        where: { id: actor.userId },
      });
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

    const m = await this.prisma.gymMember.findUnique({
      where: { id: memberIdParam },
    });
    if (!m || normalizeClubRole(m.role_name) !== 'member') {
      throw new NotFoundException('Socio no encontrado.');
    }

    if (role === 'staff_member') {
      await this.assertStaffCanViewMember(actor, m);
    }

    return m;
  }

  private async buildPersonalNutritionPlan(
    m: GymMember,
  ): Promise<NutritionPlanPayload> {
    const plan = await this.prisma.nutritionPlan.findUnique({
      where: { member_id: m.id },
    });
    if (!plan) {
      return {
        member_id: m.id,
        first_name: m.first_name,
        last_name: m.last_name,
        valid_from: null,
        valid_to: null,
        schedule_slots: [],
      };
    }
    return {
      member_id: m.id,
      first_name: m.first_name,
      last_name: m.last_name,
      valid_from: toIsoDateOnly(plan.valid_from),
      valid_to: toIsoDateOnly(plan.valid_to),
      schedule_slots: parseMealsScheduleJson(plan.meals_schedule_json),
    };
  }

  private async loadGeneralNutritionForMember(
    m: GymMember,
  ): Promise<NutritionGeneralPayload | null> {
    if ((m.subscribe_nutrition_general ?? 1) !== 1) return null;
    const plan = await this.prisma.nutritionPlanGeneral.findFirst({
      where: { is_published: 1 },
      orderBy: [{ updated_at: 'desc' }, { id: 'desc' }],
    });
    if (!plan) return null;
    return {
      id: plan.id,
      title: plan.title,
      is_published: plan.is_published === 1,
      valid_from: toIsoDateOnly(plan.valid_from),
      valid_to: toIsoDateOnly(plan.valid_to),
      schedule_slots: parseMealsScheduleJson(plan.meals_schedule_json),
    };
  }

  async getMyNutritionPlan(
    actor: JwtActor,
    memberIdParam?: number,
  ): Promise<{
    general: NutritionGeneralPayload | null;
    personal: NutritionPlanPayload;
  }> {
    const m = await this.resolveTargetMember(actor, memberIdParam);
    const [general, personal] = await Promise.all([
      this.loadGeneralNutritionForMember(m),
      this.buildPersonalNutritionPlan(m),
    ]);
    return { general, personal };
  }

  private routineIncludeLines() {
    return {
      lines: {
        include: {
          activity: {
            include: {
              videos: {
                orderBy: [{ sort_order: 'asc' as const }, { id: 'asc' as const }],
              },
            },
          },
        },
        orderBy: [{ sort_order: 'asc' as const }, { id: 'asc' as const }],
      },
    };
  }

  private async loadPersonalRoutineBlock(
    memberId: number,
  ): Promise<RoutineBlock | null> {
    const a = await this.prisma.trainingAssignment.findFirst({
      where: {
        members: { some: { member_id: memberId } },
      },
      include: {
        routine: {
          include: this.routineIncludeLines(),
        },
      },
      orderBy: { id: 'desc' },
    });
    if (!a?.routine) return null;
    return {
      id: a.id,
      routine_id: a.routine_id,
      routine_title: a.routine.title,
      created_at:
        a.created_at instanceof Date
          ? a.created_at.toISOString()
          : String(a.created_at),
      lines: this.mapRoutineLines(a.routine.lines ?? []),
    };
  }

  private async loadGeneralRoutineBlock(
    m: GymMember,
  ): Promise<RoutineBlock | null> {
    if ((m.subscribe_training_general ?? 1) !== 1) return null;
    const routine = await this.prisma.trainingRoutine.findFirst({
      where: { is_general: 1 },
      include: this.routineIncludeLines(),
      orderBy: { id: 'desc' },
    });
    if (!routine) return null;
    return {
      id: routine.id,
      routine_id: routine.id,
      routine_title: routine.title,
      created_at:
        routine.created_at instanceof Date
          ? routine.created_at.toISOString()
          : String(routine.created_at ?? ''),
      lines: this.mapRoutineLines(routine.lines ?? []),
    };
  }

  async getMyTrainingContext(
    actor: JwtActor,
    memberIdParam?: number,
  ): Promise<{
    week_start_default: string;
    general: RoutineBlock | null;
    personal: RoutineBlock | null;
  }> {
    const target = await this.resolveTargetMember(actor, memberIdParam);
    const week_start_default = madridMondayWeekStart();
    const [personal, general] = await Promise.all([
      this.loadPersonalRoutineBlock(target.id),
      this.loadGeneralRoutineBlock(target),
    ]);
    return { week_start_default, general, personal };
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
    const row = await this.prisma.memberWeeklyRoutine.findUnique({
      where: {
        member_id_week_start: {
          member_id: target.id,
          week_start: new Date(`${week_start}T00:00:00.000Z`),
        },
      },
    });
    return {
      week_start,
      routine_snapshot_json: parseRoutineSnapshotJson(
        row?.routine_snapshot_json,
      ),
      updated_at: row?.updated_at
        ? row.updated_at instanceof Date
          ? row.updated_at.toISOString()
          : String(row.updated_at)
        : null,
    };
  }
}
