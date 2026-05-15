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
import { NutritionPlan } from '../entities/nutrition-plan.entity';
import { UpsertNutritionPlanDto } from './dto/upsert-nutrition-plan.dto';
import { normalizeClubRole } from '../shared/domain/club/club-roles';
import { assertStaffOwnsMember } from '../shared/application/security/staff-member-scope';
import { toIsoDateOnly } from '../shared/domain/shared/iso-date';
import {
  dedupeNutritionSlots,
  parseMealsScheduleJson,
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
    out.push({
      weekday: r.weekday,
      hour: r.hour,
      event: event.slice(0, 8000),
    });
  }
  return dedupeSlots(out);
}

@Injectable()
export class NutritionService {
  constructor(
    @InjectRepository(GymMember)
    private readonly members: Repository<GymMember>,
    @InjectRepository(NutritionPlan)
    private readonly plans: Repository<NutritionPlan>,
    @InjectRepository(GeneralSetting)
    private readonly settings: Repository<GeneralSetting>,
  ) {}

  private assertBusinessRole(role_name: string): void {
    const r = normalizeClubRole(role_name);
    if (r !== 'administrator' && r !== 'staff_member') {
      throw new ForbiddenException(
        'Nutrición solo para administración o staff del club.',
      );
    }
  }

  private async settingsRow(): Promise<GeneralSetting | null> {
    return (
      (await this.settings.find({ take: 1, order: { id: 'ASC' } }))[0] ?? null
    );
  }

  private async assertCanManageMember(
    actor: { userId: number; role_name: string },
    member: GymMember,
  ): Promise<void> {
    this.assertBusinessRole(actor.role_name);
    assertStaffOwnsMember(actor, member);
  }

  async overview(actor: {
    userId: number;
    role_name: string;
  }): Promise<{ rows: NutritionOverviewRow[] }> {
    this.assertBusinessRole(actor.role_name);
    const role = normalizeClubRole(actor.role_name);
    const uid = actor.userId;

    const sql = `
SELECT m.id AS member_id,
  m.first_name AS first_name,
  m.last_name AS last_name,
  m.assign_staff_mem AS assign_staff_mem,
  np.id AS plan_id,
  np.valid_from AS valid_from,
  np.valid_to AS valid_to
FROM gym_member m
LEFT JOIN nutrition_plan np ON np.member_id = m.id
WHERE LOWER(TRIM(m.role_name)) = ?
ORDER BY m.first_name ASC, m.last_name ASC
`;
    const raw = (await this.members.manager.query(sql, [
      'member',
    ])) as Array<{
      member_id: number;
      first_name: string | null;
      last_name: string | null;
      assign_staff_mem: number | null;
      plan_id: number | null;
      valid_from: Date | string | null;
      valid_to: Date | string | null;
    }>;

    let filtered = raw;
    if (role === 'staff_member') {
      filtered = raw.filter((row) => row.assign_staff_mem === uid);
    }

    const planIds = [
      ...new Set(
        filtered
          .map((r) => r.plan_id)
          .filter((id): id is number => id != null && id > 0),
      ),
    ];
    const countByPlanId = new Map<number, number>();
    if (planIds.length) {
      const planRows = await this.plans.find({
        where: { id: In(planIds) },
        select: ['id', 'meals_schedule_json'],
      });
      for (const p of planRows) {
        const slots = parseMealsScheduleJson(
          p.meals_schedule_json as unknown,
        );
        countByPlanId.set(p.id, slots.length);
      }
    }

    const rows: NutritionOverviewRow[] = filtered.map((row) => ({
      member_id: row.member_id,
      first_name: row.first_name,
      last_name: row.last_name,
      plan_id: row.plan_id,
      valid_from: toIsoDateOnly(row.valid_from as Date),
      valid_to: toIsoDateOnly(row.valid_to as Date),
      meal_count:
        row.plan_id != null ? (countByPlanId.get(row.plan_id) ?? 0) : 0,
    }));

    return { rows };
  }

  async getPlanForMember(
    memberId: number,
    actor: { userId: number; role_name: string },
  ): Promise<{ plan: NutritionPlanPayload | null }> {
    this.assertBusinessRole(actor.role_name);
    const m = await this.members.findOne({ where: { id: memberId } });
    if (!m || normalizeClubRole(m.role_name) !== 'member') {
      throw new NotFoundException('Socio no encontrado.');
    }
    await this.assertCanManageMember(actor, m);

    const plan = await this.plans.findOne({
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

    const schedule_slots = parseMealsScheduleJson(
      plan.meals_schedule_json as unknown,
    );

    return {
      plan: {
        member_id: memberId,
        first_name: m.first_name,
        last_name: m.last_name,
        valid_from: toIsoDateOnly(plan.valid_from as Date),
        valid_to: toIsoDateOnly(plan.valid_to as Date),
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
    const m = await this.members.findOne({ where: { id: memberId } });
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

    let plan = await this.plans.findOne({ where: { member_id: memberId } });
    if (!plan) {
      plan = this.plans.create({
        member_id: memberId,
        valid_from: validFrom,
        valid_to: validTo,
        meals_schedule_json: slots.length ? slots : null,
        created_at: new Date(),
      });
      plan = await this.plans.save(plan);
    } else {
      plan.valid_from = validFrom;
      plan.valid_to = validTo;
      plan.meals_schedule_json = slots.length ? slots : null;
      await this.plans.save(plan);
    }

    const res = await this.getPlanForMember(memberId, actor);
    if (!res.plan) throw new NotFoundException();
    return { plan: res.plan };
  }

  async deletePlanForMember(
    memberId: number,
    actor: { userId: number; role_name: string },
  ): Promise<{ ok: true }> {
    this.assertBusinessRole(actor.role_name);
    const m = await this.members.findOne({ where: { id: memberId } });
    if (!m || normalizeClubRole(m.role_name) !== 'member') {
      throw new NotFoundException('Socio no encontrado.');
    }
    await this.assertCanManageMember(actor, m);

    await this.plans.delete({ member_id: memberId });
    return { ok: true };
  }
}
