import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { GymMember } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UpsertNutritionGeneralDto } from './dto/upsert-nutrition-general.dto';
import { UpsertNutritionPlanDto } from './dto/upsert-nutrition-plan.dto';
import {
  buildPageMeta,
  paginationSkip,
  type PaginatedMeta,
} from '../shared/dto/paginated-meta';
import { normalizeClubRole } from '../shared/domain/club/club-roles';
import { assertStaffOwnsMember } from '../shared/application/security/staff-member-scope';
import { toIsoDateOnly } from '../shared/domain/shared/iso-date';
import {
  dedupeNutritionSlots,
  parseMealsScheduleJson,
  stringifyMealsScheduleJson,
  type NutritionIngredientLine,
  type NutritionScheduleSlot,
} from './schedule-json.util';

export type NutritionOverviewRow = {
  member_id: number;
  first_name: string | null;
  last_name: string | null;
  plan_id: number | null;
  valid_from: string | null;
  valid_to: string | null;
  meal_count: number;
};

export type NutritionPlanPayload = {
  member_id: number;
  first_name: string | null;
  last_name: string | null;
  valid_from: string | null;
  valid_to: string | null;
  schedule_slots: NutritionScheduleSlot[];
};

export type NutritionGeneralPayload = {
  id: number;
  title: string;
  is_published: boolean;
  valid_from: string | null;
  valid_to: string | null;
  schedule_slots: NutritionScheduleSlot[];
};

function dedupeSlots(slots: NutritionScheduleSlot[]): NutritionScheduleSlot[] {
  return dedupeNutritionSlots(slots);
}

function normalizeSlotsFromDto(dto: UpsertNutritionPlanDto): NutritionScheduleSlot[] {
  const raw = dto.schedule_slots ?? [];
  if (!Array.isArray(raw)) {
    throw new BadRequestException('schedule_slots debe ser un arreglo.');
  }
  const out: NutritionScheduleSlot[] = [];
  for (const r of raw) {
    const event = (r.event ?? '').trim();
    if (!event) continue;
    if (r.weekday < 0 || r.weekday > 6 || r.hour < 5 || r.hour > 23) {
      throw new BadRequestException(
        'Cada franja debe tener weekday 0–6 y hour 5–23.',
      );
    }
    const dishPart = (r.dish ?? '').trim();
    const dish = dishPart ? dishPart.slice(0, 4000) : null;
    let ingredients: NutritionIngredientLine[] | null = null;
    if (Array.isArray(r.ingredients)) {
      const ing: NutritionIngredientLine[] = [];
      for (const row of r.ingredients) {
        const name = String(row?.name ?? '').trim().slice(0, 200);
        if (!name) continue;
        ing.push({
          name,
          quantity: String(row?.quantity ?? '').trim().slice(0, 200),
        });
        if (ing.length >= 100) break;
      }
      if (ing.length) ingredients = ing;
    }
    out.push({
      weekday: r.weekday,
      hour: r.hour,
      event: event.slice(0, 8000),
      dish,
      ingredients,
    });
  }
  return dedupeSlots(out);
}

@Injectable()
export class NutritionService {
  constructor(private readonly prisma: PrismaService) {}

  private assertBusinessRole(role_name: string): void {
    const r = normalizeClubRole(role_name);
    if (r !== 'administrator' && r !== 'staff_member') {
      throw new ForbiddenException(
        'Nutrición solo para administración o staff del club.',
      );
    }
  }

  private async assertCanManageMember(
    actor: { userId: number; role_name: string },
    member: GymMember,
  ): Promise<void> {
    this.assertBusinessRole(actor.role_name);
    assertStaffOwnsMember(actor, member);
  }

  async overview(
    actor: { userId: number; role_name: string },
    page = 1,
    pageSize = 25,
    q?: string,
  ): Promise<{ rows: NutritionOverviewRow[]; meta: PaginatedMeta }> {
    this.assertBusinessRole(actor.role_name);
    const role = normalizeClubRole(actor.role_name);
    const uid = actor.userId;
    const ps = Math.min(100, Math.max(1, pageSize));
    const pg = Math.max(1, page);

    const conditions: Prisma.Sql[] = [
      Prisma.sql`LOWER(TRIM(m.role_name)) = 'member'`,
    ];
    if (role === 'staff_member') {
      conditions.push(Prisma.sql`m.assign_staff_mem = ${uid}`);
    }
    const qTrim = q?.trim();
    if (qTrim) {
      const like = `%${qTrim.replace(/[%_\\]/g, '\\$&')}%`;
      conditions.push(
        Prisma.sql`(LOWER(CONCAT(COALESCE(m.first_name,''), ' ', COALESCE(m.last_name,''))) LIKE LOWER(${like}) OR CAST(m.id AS CHAR) LIKE ${like})`,
      );
    }
    const whereSql = Prisma.join(conditions, ' AND ');

    const countRow = await this.prisma.$queryRaw<Array<{ cnt: bigint | number }>>`
      SELECT COUNT(*) AS cnt
      FROM gym_member m
      WHERE ${whereSql}
    `;
    const total = Number(countRow[0]?.cnt ?? 0);

    const raw = await this.prisma.$queryRaw<
      Array<{
        member_id: number;
        first_name: string | null;
        last_name: string | null;
        plan_id: number | null;
        valid_from: Date | string | null;
        valid_to: Date | string | null;
        meal_count: number | string | null;
      }>
    >`
      SELECT m.id AS member_id,
        m.first_name AS first_name,
        m.last_name AS last_name,
        np.id AS plan_id,
        np.valid_from AS valid_from,
        np.valid_to AS valid_to,
        COALESCE(JSON_LENGTH(np.meals_schedule_json), 0) AS meal_count
      FROM gym_member m
      LEFT JOIN nutrition_plan np ON np.member_id = m.id
      WHERE ${whereSql}
      ORDER BY m.first_name ASC, m.last_name ASC
      LIMIT ${ps} OFFSET ${paginationSkip(pg, ps)}
    `;

    const rows: NutritionOverviewRow[] = raw.map((row) => ({
      member_id: row.member_id,
      first_name: row.first_name,
      last_name: row.last_name,
      plan_id: row.plan_id,
      valid_from: toIsoDateOnly(row.valid_from),
      valid_to: toIsoDateOnly(row.valid_to),
      meal_count: Number(row.meal_count ?? 0),
    }));

    return { rows, meta: buildPageMeta(total, pg, ps) };
  }

  async getPlanForMember(
    memberId: number,
    actor: { userId: number; role_name: string },
  ): Promise<{ plan: NutritionPlanPayload | null }> {
    this.assertBusinessRole(actor.role_name);
    const m = await this.prisma.gymMember.findUnique({
      where: { id: memberId },
    });
    if (!m || normalizeClubRole(m.role_name) !== 'member') {
      throw new NotFoundException('Socio no encontrado.');
    }
    await this.assertCanManageMember(actor, m);

    const plan = await this.prisma.nutritionPlan.findUnique({
      where: { member_id: memberId },
    });

    if (!plan) {
      return {
        plan: {
          member_id: memberId,
          first_name: m.first_name,
          last_name: m.last_name,
          valid_from: null,
          valid_to: null,
          schedule_slots: [],
        },
      };
    }

    const schedule_slots = parseMealsScheduleJson(plan.meals_schedule_json);

    return {
      plan: {
        member_id: memberId,
        first_name: m.first_name,
        last_name: m.last_name,
        valid_from: toIsoDateOnly(plan.valid_from),
        valid_to: toIsoDateOnly(plan.valid_to),
        schedule_slots,
      },
    };
  }

  async upsertPlanForMember(
    memberId: number,
    dto: UpsertNutritionPlanDto,
    actor: { userId: number; role_name: string },
  ): Promise<{ plan: NutritionPlanPayload }> {
    this.assertBusinessRole(actor.role_name);
    const m = await this.prisma.gymMember.findUnique({
      where: { id: memberId },
    });
    if (!m || normalizeClubRole(m.role_name) !== 'member') {
      throw new NotFoundException('Socio no encontrado.');
    }
    await this.assertCanManageMember(actor, m);

    const validFrom =
      dto.valid_from && dto.valid_from !== ''
        ? new Date(dto.valid_from)
        : null;
    const validTo =
      dto.valid_to && dto.valid_to !== '' ? new Date(dto.valid_to) : null;

    const slots = normalizeSlotsFromDto(dto);
    const meals_schedule_json = stringifyMealsScheduleJson(slots);

    await this.prisma.nutritionPlan.upsert({
      where: { member_id: memberId },
      create: {
        member_id: memberId,
        valid_from: validFrom,
        valid_to: validTo,
        meals_schedule_json,
        created_at: new Date(),
      },
      update: {
        valid_from: validFrom,
        valid_to: validTo,
        meals_schedule_json,
      },
    });

    const res = await this.getPlanForMember(memberId, actor);
    if (!res.plan) throw new NotFoundException();
    return { plan: res.plan };
  }

  async deletePlanForMember(
    memberId: number,
    actor: { userId: number; role_name: string },
  ): Promise<{ ok: true }> {
    this.assertBusinessRole(actor.role_name);
    const m = await this.prisma.gymMember.findUnique({
      where: { id: memberId },
    });
    if (!m || normalizeClubRole(m.role_name) !== 'member') {
      throw new NotFoundException('Socio no encontrado.');
    }
    await this.assertCanManageMember(actor, m);

    await this.prisma.nutritionPlan.deleteMany({
      where: { member_id: memberId },
    });
    return { ok: true };
  }

  private mapGeneralPlanRow(plan: {
    id: number;
    title: string;
    is_published: number;
    valid_from: Date | string | null;
    valid_to: Date | string | null;
    meals_schedule_json: string | null;
  }): NutritionGeneralPayload {
    return {
      id: plan.id,
      title: plan.title,
      is_published: plan.is_published === 1,
      valid_from: toIsoDateOnly(plan.valid_from),
      valid_to: toIsoDateOnly(plan.valid_to),
      schedule_slots: parseMealsScheduleJson(plan.meals_schedule_json),
    };
  }

  async getGeneralPlan(actor: {
    userId: number;
    role_name: string;
  }): Promise<{ plan: NutritionGeneralPayload | null }> {
    this.assertBusinessRole(actor.role_name);
    const plan = await this.prisma.nutritionPlanGeneral.findFirst({
      orderBy: { id: 'asc' },
    });
    if (!plan) return { plan: null };
    return { plan: this.mapGeneralPlanRow(plan) };
  }

  async upsertGeneralPlan(
    dto: UpsertNutritionGeneralDto,
    actor: { userId: number; role_name: string },
  ): Promise<{ plan: NutritionGeneralPayload }> {
    this.assertBusinessRole(actor.role_name);

    const validFrom =
      dto.valid_from && dto.valid_from !== ''
        ? new Date(dto.valid_from)
        : null;
    const validTo =
      dto.valid_to && dto.valid_to !== '' ? new Date(dto.valid_to) : null;

    const slots = normalizeSlotsFromDto(dto);
    const meals_schedule_json = stringifyMealsScheduleJson(slots);

    const isPublished =
      dto.is_published === undefined ? undefined : dto.is_published ? 1 : 0;

    const existing = await this.prisma.nutritionPlanGeneral.findFirst({
      orderBy: { id: 'asc' },
    });

    if (existing) {
      await this.prisma.nutritionPlanGeneral.update({
        where: { id: existing.id },
        data: {
          ...(dto.title !== undefined
            ? {
                title: (dto.title.trim() || 'Dieta general').slice(0, 200),
              }
            : {}),
          ...(isPublished !== undefined ? { is_published: isPublished } : {}),
          valid_from: validFrom,
          valid_to: validTo,
          meals_schedule_json,
        },
      });
    } else {
      await this.prisma.nutritionPlanGeneral.create({
        data: {
          title:
            dto.title !== undefined
              ? (dto.title.trim() || 'Dieta general').slice(0, 200)
              : 'Dieta general',
          is_published: isPublished ?? 1,
          valid_from: validFrom,
          valid_to: validTo,
          meals_schedule_json,
          created_at: new Date(),
        },
      });
    }

    const saved = await this.prisma.nutritionPlanGeneral.findFirst({
      orderBy: { id: 'asc' },
    });
    if (!saved) throw new NotFoundException('Plan general no encontrado.');
    return { plan: this.mapGeneralPlanRow(saved) };
  }
}
