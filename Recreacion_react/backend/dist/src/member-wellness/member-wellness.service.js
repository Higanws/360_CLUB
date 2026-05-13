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
var MemberWellnessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberWellnessService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const general_setting_entity_1 = require("../entities/general-setting.entity");
const gym_member_entity_1 = require("../entities/gym-member.entity");
const member_weekly_routine_entity_1 = require("../entities/member-weekly-routine.entity");
const nutrition_plan_entity_1 = require("../entities/nutrition-plan.entity");
const training_assignment_entity_1 = require("../entities/training-assignment.entity");
const schedule_json_util_1 = require("../nutrition/schedule-json.util");
const madrid_week_util_1 = require("./madrid-week.util");
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
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
function dayKeysFromMask(mask) {
    const out = [];
    for (let i = 0; i < 7; i++) {
        if ((mask & (1 << i)) !== 0)
            out.push(DAY_KEYS[i]);
    }
    return out;
}
let MemberWellnessService = MemberWellnessService_1 = class MemberWellnessService {
    constructor(settings, members, plans, assignments, weeklyRows) {
        this.settings = settings;
        this.members = members;
        this.plans = plans;
        this.assignments = assignments;
        this.weeklyRows = weeklyRows;
    }
    async settingsRow() {
        return ((await this.settings.find({ take: 1, order: { id: 'ASC' } }))[0] ?? null);
    }
    async assertStaffCanViewMember(actor, member) {
        if (normRole(actor.role_name) !== 'staff_member')
            return;
        const row = await this.settingsRow();
        const ownOnly = row?.staff_can_view_own_member === 1;
        if (ownOnly && member.assign_staff_mem !== actor.userId) {
            throw new common_1.ForbiddenException('No tienes acceso a este socio (no está asignado a ti).');
        }
    }
    async resolveTargetMember(actor, memberIdParam) {
        const role = normRole(actor.role_name);
        if (role !== 'member' && role !== 'administrator' && role !== 'staff_member') {
            throw new common_1.ForbiddenException('No autorizado.');
        }
        if (role === 'member') {
            const m = await this.members.findOne({ where: { id: actor.userId } });
            if (!m || normRole(m.role_name) !== 'member') {
                throw new common_1.NotFoundException('Socio no encontrado.');
            }
            return m;
        }
        if (memberIdParam == null ||
            !Number.isFinite(memberIdParam) ||
            memberIdParam < 1) {
            throw new common_1.BadRequestException('Indica member_id en la petición (identificador numérico del socio en el club).');
        }
        const m = await this.members.findOne({ where: { id: memberIdParam } });
        if (!m || normRole(m.role_name) !== 'member') {
            throw new common_1.NotFoundException('Socio no encontrado.');
        }
        if (role === 'staff_member') {
            await this.assertStaffCanViewMember(actor, m);
        }
        return m;
    }
    async getMyNutritionPlan(actor, memberIdParam) {
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
        const schedule_slots = (0, schedule_json_util_1.parseMealsScheduleJson)(plan.meals_schedule_json);
        return {
            plan: {
                member_id: m.id,
                first_name: m.first_name,
                last_name: m.last_name,
                valid_from: isoDateOnly(plan.valid_from),
                valid_to: isoDateOnly(plan.valid_to),
                schedule_slots,
            },
        };
    }
    async getMyTrainingContext(actor, memberIdParam) {
        const target = await this.resolveTargetMember(actor, memberIdParam);
        const week_start_default = (0, madrid_week_util_1.madridMondayWeekStart)();
        const a = await this.assignments
            .createQueryBuilder('a')
            .innerJoin('a.members', 'm', 'm.member_id = :uid', { uid: target.id })
            .leftJoinAndSelect('a.routine', 'r')
            .leftJoinAndSelect('r.lines', 'l')
            .leftJoinAndSelect('l.activity', 'act')
            .orderBy('a.id', 'DESC')
            .take(1)
            .getOne();
        if (!a?.routine) {
            return { week_start_default, assignment: null };
        }
        const lines = [...(a.routine.lines ?? [])].sort((x, y) => {
            if (x.sort_order !== y.sort_order)
                return x.sort_order - y.sort_order;
            return x.id - y.id;
        });
        return {
            week_start_default,
            assignment: {
                id: a.id,
                routine_id: a.routine_id,
                routine_title: a.routine.title,
                created_at: a.created_at instanceof Date
                    ? a.created_at.toISOString()
                    : String(a.created_at),
                lines: lines.map((l) => ({
                    id: l.id,
                    activity_id: l.activity_id,
                    title: l.activity?.title ?? `Ejercicio ${l.activity_id}`,
                    sort_order: l.sort_order,
                    weight_kg: l.weight_kg ?? null,
                    weekdays_mask: l.weekdays_mask,
                    day_keys: dayKeysFromMask(l.weekdays_mask),
                })),
            },
        };
    }
    async getWeeklyRoutine(actor, weekStartParam, memberIdParam) {
        const target = await this.resolveTargetMember(actor, memberIdParam);
        const week_start = weekStartParam?.trim()
            ? weekStartParam.trim()
            : (0, madrid_week_util_1.madridMondayWeekStart)();
        if (!(0, madrid_week_util_1.isMondayYmdInMadrid)(week_start)) {
            throw new common_1.BadRequestException('week_start debe ser un lunes (calendario Europe/Madrid).');
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
    async patchWeeklyRoutine(actor, dto) {
        const target = await this.resolveTargetMember(actor, dto.member_id);
        const week_start = dto.week_start.trim();
        if (!(0, madrid_week_util_1.isMondayYmdInMadrid)(week_start)) {
            throw new common_1.BadRequestException('week_start debe ser un lunes (calendario Europe/Madrid).');
        }
        const json = JSON.stringify(dto.routine_snapshot_json);
        if (json.length > MemberWellnessService_1.SNAPSHOT_JSON_MAX) {
            throw new common_1.BadRequestException('routine_snapshot_json demasiado grande.');
        }
        let row = await this.weeklyRows.findOne({
            where: { member_id: target.id, week_start },
        });
        if (!row) {
            row = this.weeklyRows.create({
                member_id: target.id,
                week_start,
                routine_snapshot_json: dto.routine_snapshot_json,
            });
        }
        else {
            row.routine_snapshot_json = dto.routine_snapshot_json;
        }
        row = await this.weeklyRows.save(row);
        return {
            week_start,
            routine_snapshot_json: dto.routine_snapshot_json,
            updated_at: row.updated_at instanceof Date
                ? row.updated_at.toISOString()
                : String(row.updated_at),
        };
    }
};
exports.MemberWellnessService = MemberWellnessService;
MemberWellnessService.SNAPSHOT_JSON_MAX = 96_000;
exports.MemberWellnessService = MemberWellnessService = MemberWellnessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(general_setting_entity_1.GeneralSetting)),
    __param(1, (0, typeorm_1.InjectRepository)(gym_member_entity_1.GymMember)),
    __param(2, (0, typeorm_1.InjectRepository)(nutrition_plan_entity_1.NutritionPlan)),
    __param(3, (0, typeorm_1.InjectRepository)(training_assignment_entity_1.TrainingAssignment)),
    __param(4, (0, typeorm_1.InjectRepository)(member_weekly_routine_entity_1.MemberWeeklyRoutine)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MemberWellnessService);
//# sourceMappingURL=member-wellness.service.js.map