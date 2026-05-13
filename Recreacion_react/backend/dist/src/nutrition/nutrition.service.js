"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NutritionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const general_setting_entity_1 = require("../entities/general-setting.entity");
const gym_member_entity_1 = require("../entities/gym-member.entity");
const nutrition_plan_entity_1 = require("../entities/nutrition-plan.entity");
const schedule_json_util_1 = require("./schedule-json.util");
function normRole(r) {
    return (r ?? '').trim().toLowerCase();
}
function isoDateOnly(v) {
    if (v == null)
        return null;
    if (v instanceof Date)
        return v.toISOString().slice(0, 10);
    const s = String(v);
    return s.length >= 10 ? s.slice(0, 10) : s;
}
function dedupeSlots(slots) {
    return (0, schedule_json_util_1.dedupeNutritionSlots)(slots);
}
function normalizeSlotsFromDto(dto) {
    const raw = dto.schedule_slots ?? [];
    if (!Array.isArray(raw)) {
        throw new common_1.BadRequestException('schedule_slots debe ser un arreglo.');
    }
    const out = [];
    for (const r of raw) {
        const event = (r.event ?? '').trim();
        if (!event)
            continue;
        if (r.weekday < 0 || r.weekday > 6 || r.hour < 5 || r.hour > 23) {
            throw new common_1.BadRequestException('Cada franja debe tener weekday 0–6 y hour 5–23.');
        }
        out.push({
            weekday: r.weekday,
            hour: r.hour,
            event: event.slice(0, 8000),
        });
    }
    return dedupeSlots(out);
}
let NutritionService = class NutritionService {
    constructor(members, plans, settings) {
        this.members = members;
        this.plans = plans;
        this.settings = settings;
    }
    assertBusinessRole(role_name) {
        const r = normRole(role_name);
        if (r !== 'administrator' && r !== 'staff_member') {
            throw new common_1.ForbiddenException('Nutrición solo para administración o staff del club.');
        }
    }
    async settingsRow() {
        return ((await this.settings.find({ take: 1, order: { id: 'ASC' } }))[0] ?? null);
    }
    async assertCanManageMember(actor, member) {
        this.assertBusinessRole(actor.role_name);
        const r = normRole(actor.role_name);
        if (r === 'administrator')
            return;
        const s = await this.settingsRow();
        const ownOnly = s?.staff_can_view_own_member === 1;
        if (ownOnly) {
            if (member.assign_staff_mem !== actor.userId) {
                throw new common_1.ForbiddenException('No puedes gestionar socios que no tienes asignados.');
            }
        }
    }
    async overview(actor) {
        this.assertBusinessRole(actor.role_name);
        const role = normRole(actor.role_name);
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
        ]));
        let filtered = raw;
        if (role === 'staff_member') {
            const settingRow = await this.settingsRow();
            const ownOnly = settingRow?.staff_can_view_own_member === 1;
            if (ownOnly) {
                filtered = raw.filter((row) => row.assign_staff_mem === uid);
            }
        }
        const planIds = [
            ...new Set(filtered
                .map((r) => r.plan_id)
                .filter((id) => id != null && id > 0)),
        ];
        const countByPlanId = new Map();
        if (planIds.length) {
            const planRows = await this.plans.find({
                where: { id: (0, typeorm_2.In)(planIds) },
                select: ['id', 'meals_schedule_json'],
            });
            for (const p of planRows) {
                const slots = (0, schedule_json_util_1.parseMealsScheduleJson)(p.meals_schedule_json);
                countByPlanId.set(p.id, slots.length);
            }
        }
        const rows = filtered.map((row) => ({
            member_id: row.member_id,
            first_name: row.first_name,
            last_name: row.last_name,
            plan_id: row.plan_id,
            valid_from: isoDateOnly(row.valid_from),
            valid_to: isoDateOnly(row.valid_to),
            meal_count: row.plan_id != null ? (countByPlanId.get(row.plan_id) ?? 0) : 0,
        }));
        return { rows };
    }
    async getPlanForMember(memberId, actor) {
        this.assertBusinessRole(actor.role_name);
        const m = await this.members.findOne({ where: { id: memberId } });
        if (!m || normRole(m.role_name) !== 'member') {
            throw new common_1.NotFoundException('Socio no encontrado.');
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
        const schedule_slots = (0, schedule_json_util_1.parseMealsScheduleJson)(plan.meals_schedule_json);
        return {
            plan: {
                member_id: memberId,
                first_name: m.first_name,
                last_name: m.last_name,
                valid_from: isoDateOnly(plan.valid_from),
                valid_to: isoDateOnly(plan.valid_to),
                schedule_slots,
            },
        };
    }
    async upsertPlanForMember(memberId, dto, actor) {
        this.assertBusinessRole(actor.role_name);
        const m = await this.members.findOne({ where: { id: memberId } });
        if (!m || normRole(m.role_name) !== 'member') {
            throw new common_1.NotFoundException('Socio no encontrado.');
        }
        await this.assertCanManageMember(actor, m);
        const validFrom = dto.valid_from && dto.valid_from !== ''
            ? new Date(dto.valid_from)
            : null;
        const validTo = dto.valid_to && dto.valid_to !== '' ? new Date(dto.valid_to) : null;
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
        }
        else {
            plan.valid_from = validFrom;
            plan.valid_to = validTo;
            plan.meals_schedule_json = slots.length ? slots : null;
            await this.plans.save(plan);
        }
        const res = await this.getPlanForMember(memberId, actor);
        if (!res.plan)
            throw new common_1.NotFoundException();
        return { plan: res.plan };
    }
    async deletePlanForMember(memberId, actor) {
        this.assertBusinessRole(actor.role_name);
        const m = await this.members.findOne({ where: { id: memberId } });
        if (!m || normRole(m.role_name) !== 'member') {
            throw new common_1.NotFoundException('Socio no encontrado.');
        }
        await this.assertCanManageMember(actor, m);
        await this.plans.delete({ member_id: memberId });
        return { ok: true };
    }
};
exports.NutritionService = NutritionService;
exports.NutritionService = NutritionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(gym_member_entity_1.GymMember)),
    __param(1, (0, typeorm_1.InjectRepository)(nutrition_plan_entity_1.NutritionPlan)),
    __param(2, (0, typeorm_1.InjectRepository)(general_setting_entity_1.GeneralSetting)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], NutritionService);
//# sourceMappingURL=nutrition.service.js.map