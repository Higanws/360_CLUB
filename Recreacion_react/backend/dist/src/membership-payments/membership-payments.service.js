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
exports.MembershipPaymentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const general_setting_entity_1 = require("../entities/general-setting.entity");
const gym_member_entity_1 = require("../entities/gym-member.entity");
const membership_payment_entity_1 = require("../entities/membership-payment.entity");
const membership_entity_1 = require("../entities/membership.entity");
function padIsoDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function normRole(r) {
    return (r ?? '').trim().toLowerCase();
}
let MembershipPaymentsService = class MembershipPaymentsService {
    constructor(payments, members, plans, settings) {
        this.payments = payments;
        this.members = members;
        this.plans = plans;
        this.settings = settings;
    }
    async settingsRow() {
        return ((await this.settings.find({ take: 1, order: { id: 'ASC' } }))[0] ?? null);
    }
    async listExpiringThisMonth(actor) {
        const r = normRole(actor.role_name);
        if (r !== 'administrator' && r !== 'staff_member') {
            throw new common_1.ForbiddenException('Solo administración o staff puede ver cobros de membresía.');
        }
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const monthStart = padIsoDate(new Date(y, m, 1));
        const monthEnd = padIsoDate(new Date(y, m + 1, 0));
        const settingRow = await this.settingsRow();
        const ownOnly = r === 'staff_member' && settingRow?.staff_can_view_own_member === 1;
        const qb = this.payments
            .createQueryBuilder('mp')
            .leftJoin(gym_member_entity_1.GymMember, 'gm', 'gm.id = mp.member_id')
            .leftJoin(membership_entity_1.Membership, 'plan', 'plan.id = mp.membership_id')
            .where('mp.end_date IS NOT NULL')
            .andWhere('mp.end_date >= :monthStart', { monthStart })
            .andWhere('mp.end_date <= :monthEnd', { monthEnd });
        if (ownOnly) {
            qb.andWhere('gm.assign_staff_mem = :uid', { uid: actor.userId });
        }
        const raw = await qb
            .select([
            'mp.mp_id AS mp_id',
            'mp.member_id AS member_id',
            'mp.membership_id AS membership_id',
            'mp.membership_amount AS membership_amount',
            'mp.paid_amount AS paid_amount',
            'mp.start_date AS start_date',
            'mp.end_date AS end_date',
            'mp.payment_status AS payment_status',
            'mp.membership_status AS membership_status',
            'gm.first_name AS first_name',
            'gm.last_name AS last_name',
            'plan.membership_label AS membership_label',
        ])
            .orderBy('mp.end_date', 'ASC')
            .addOrderBy('mp.mp_id', 'ASC')
            .getRawMany();
        const rows = raw.map((row) => {
            const total = Number(row.membership_amount ?? 0);
            const paid = Number(row.paid_amount ?? 0);
            const owed = Math.max(0, total - paid);
            const fn = row.first_name ?? '';
            const ln = row.last_name ?? '';
            const member_name = [fn, ln].filter(Boolean).join(' ').trim() || '—';
            return {
                mp_id: Number(row.mp_id),
                member_id: row.member_id != null ? Number(row.member_id) : null,
                membership_id: row.membership_id != null ? Number(row.membership_id) : null,
                membership_label: row.membership_label ?? null,
                member_name,
                membership_amount: total,
                paid_amount: paid,
                amount_owed: owed,
                start_date: row.start_date
                    ? String(row.start_date).slice(0, 10)
                    : null,
                end_date: row.end_date ? String(row.end_date).slice(0, 10) : null,
                payment_status: row.payment_status ?? null,
                membership_status: row.membership_status ?? null,
            };
        });
        return {
            title: 'Cobro',
            subtitle: 'Cobro de membresías',
            rows,
        };
    }
    async manualFormOptions(actor) {
        const r = normRole(actor.role_name);
        if (r !== 'administrator' && r !== 'staff_member') {
            throw new common_1.ForbiddenException('Solo administración o staff puede registrar cobros.');
        }
        const settingRow = await this.settingsRow();
        const ownOnly = r === 'staff_member' && settingRow?.staff_can_view_own_member === 1;
        const mq = this.members
            .createQueryBuilder('m')
            .select(['m.id', 'm.first_name', 'm.last_name'])
            .where('LOWER(TRIM(m.role_name)) = :mr', { mr: 'member' })
            .orderBy('m.first_name', 'ASC');
        if (ownOnly) {
            mq.andWhere('m.assign_staff_mem = :uid', { uid: actor.userId });
        }
        const memRows = await mq.getMany();
        const plans = await this.plans.find({
            order: { membership_label: 'ASC' },
        });
        return {
            members: memRows.map((m) => ({
                id: m.id,
                label: [m.first_name, m.last_name].filter(Boolean).join(' ').trim(),
            })),
            memberships: plans.map((p) => ({
                id: p.id,
                label: p.membership_label,
                amount: p.membership_amount ?? null,
            })),
        };
    }
    async registerManual(dto, actor) {
        const r = normRole(actor.role_name);
        if (r !== 'administrator' && r !== 'staff_member') {
            throw new common_1.ForbiddenException('Solo administración o staff puede registrar cobros.');
        }
        const member = await this.members.findOne({
            where: { id: dto.member_id },
        });
        if (!member || normRole(member.role_name) !== 'member') {
            throw new common_1.NotFoundException('Socio no encontrado.');
        }
        const settingRow = await this.settingsRow();
        const ownOnly = r === 'staff_member' && settingRow?.staff_can_view_own_member === 1;
        if (ownOnly &&
            member.assign_staff_mem != null &&
            member.assign_staff_mem !== actor.userId) {
            throw new common_1.ForbiddenException('No puedes registrar cobros para socios que no tienes asignados.');
        }
        const plan = await this.plans.findOne({
            where: { id: dto.membership_id },
        });
        if (!plan) {
            throw new common_1.NotFoundException('Plan de membresía no encontrado.');
        }
        const total = dto.membership_amount ?? plan.membership_amount ?? 0;
        if (total < 0 || dto.paid_amount < 0) {
            throw new common_1.BadRequestException('Importes no válidos.');
        }
        const start = new Date(dto.start_date);
        const end = new Date(dto.end_date);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            throw new common_1.BadRequestException('Fechas no válidas.');
        }
        const membership_status = dto.paid_amount >= total ? 'Continue' : 'Not Available';
        const row = this.payments.create({
            member_id: dto.member_id,
            membership_id: dto.membership_id,
            membership_amount: total,
            paid_amount: dto.paid_amount,
            start_date: dto.start_date.slice(0, 10),
            end_date: dto.end_date.slice(0, 10),
            membership_status,
            payment_status: dto.paid_amount >= total ? '1' : '0',
            created_date: new Date(),
            created_by: actor.userId,
        });
        const saved = await this.payments.save(row);
        return { ok: true, mp_id: saved.mp_id };
    }
    async markPaid(mpId, actor) {
        const r = normRole(actor.role_name);
        if (r !== 'administrator' && r !== 'staff_member') {
            throw new common_1.ForbiddenException('Solo administración o staff puede actualizar cobros.');
        }
        const mp = await this.payments.findOne({ where: { mp_id: mpId } });
        if (!mp)
            throw new common_1.NotFoundException('Registro de cobro no encontrado.');
        if (mp.member_id != null) {
            const member = await this.members.findOne({
                where: { id: mp.member_id },
            });
            if (member && normRole(member.role_name) === 'member') {
                const settingRow = await this.settingsRow();
                const ownOnly = r === 'staff_member' && settingRow?.staff_can_view_own_member === 1;
                if (ownOnly &&
                    member.assign_staff_mem != null &&
                    member.assign_staff_mem !== actor.userId) {
                    throw new common_1.ForbiddenException('No puedes modificar cobros de socios que no tienes asignados.');
                }
            }
        }
        const total = Number(mp.membership_amount ?? 0);
        mp.paid_amount = total;
        mp.payment_status = '1';
        mp.membership_status = 'Continue';
        await this.payments.save(mp);
        return { ok: true };
    }
};
exports.MembershipPaymentsService = MembershipPaymentsService;
exports.MembershipPaymentsService = MembershipPaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(membership_payment_entity_1.MembershipPayment)),
    __param(1, (0, typeorm_1.InjectRepository)(gym_member_entity_1.GymMember)),
    __param(2, (0, typeorm_1.InjectRepository)(membership_entity_1.Membership)),
    __param(3, (0, typeorm_1.InjectRepository)(general_setting_entity_1.GeneralSetting)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MembershipPaymentsService);
//# sourceMappingURL=membership-payments.service.js.map