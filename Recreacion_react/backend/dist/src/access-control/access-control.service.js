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
var AccessControlService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessControlService = void 0;
exports.normalizeMemberLookupToken = normalizeMemberLookupToken;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const club_access_log_entity_1 = require("../entities/club-access-log.entity");
const general_setting_entity_1 = require("../entities/general-setting.entity");
const gym_member_entity_1 = require("../entities/gym-member.entity");
const membership_payment_entity_1 = require("../entities/membership-payment.entity");
const madrid_week_util_1 = require("../member-wellness/madrid-week.util");
function normRole(r) {
    return (r ?? '').trim().toLowerCase();
}
function isoDateOnly(v) {
    if (v == null)
        return null;
    if (v instanceof Date)
        return v.toISOString().slice(0, 10);
    const s = String(v);
    return s.length >= 10 ? s.slice(0, 10) : null;
}
function normalizeMemberLookupToken(raw) {
    return raw.trim().toUpperCase().replace(/\s+/g, '');
}
let AccessControlService = AccessControlService_1 = class AccessControlService {
    constructor(settings, members, payments, logs) {
        this.settings = settings;
        this.members = members;
        this.payments = payments;
        this.logs = logs;
        this.logger = new common_1.Logger(AccessControlService_1.name);
    }
    async settingsRow() {
        return ((await this.settings.find({ take: 1, order: { id: 'ASC' } }))[0] ?? null);
    }
    async assertStaffMayViewMember(actor, member) {
        if (normRole(actor.role_name) !== 'staff_member')
            return;
        const row = await this.settingsRow();
        const ownOnly = row?.staff_can_view_own_member === 1;
        if (ownOnly && member.assign_staff_mem !== actor.userId) {
            throw new common_1.ForbiddenException('No puedes registrar acceso de socios que no tienes asignados.');
        }
    }
    async findMemberByLookup(lookupRaw) {
        const q = lookupRaw.trim();
        if (!q)
            return null;
        if (/^\d+$/.test(q)) {
            const id = parseInt(q, 10);
            return this.members
                .createQueryBuilder('m')
                .where('m.id = :id', { id })
                .andWhere('LOWER(TRIM(m.role_name)) = :r', { r: 'member' })
                .getOne();
        }
        const token = normalizeMemberLookupToken(q);
        if (!token)
            return null;
        const byCode = await this.members
            .createQueryBuilder('m')
            .where('LOWER(TRIM(m.role_name)) = :r', { r: 'member' })
            .andWhere("UPPER(REPLACE(TRIM(COALESCE(m.member_id,'')), ' ', '')) = :t", { t: token })
            .getOne();
        if (byCode)
            return byCode;
        return this.members
            .createQueryBuilder('m')
            .where('LOWER(TRIM(m.role_name)) = :r', { r: 'member' })
            .andWhere("UPPER(REPLACE(TRIM(COALESCE(m.di_dni_number,'')), ' ', '')) = :t", { t: token })
            .getOne();
    }
    async latestPaymentEnd(memberId) {
        const row = await this.payments
            .createQueryBuilder('mp')
            .where('mp.member_id = :mid', { mid: memberId })
            .andWhere('mp.end_date IS NOT NULL')
            .orderBy('mp.end_date', 'DESC')
            .addOrderBy('mp.mp_id', 'DESC')
            .getOne();
        if (!row?.end_date)
            return { end: null, start: null };
        return {
            end: isoDateOnly(row.end_date),
            start: isoDateOnly(row.start_date),
        };
    }
    cycleTypeFromRange(start, end) {
        if (!start || !end)
            return '';
        const a = new Date(start + 'T12:00:00Z').getTime();
        const b = new Date(end + 'T12:00:00Z').getTime();
        if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a)
            return '';
        const days = Math.floor((b - a) / 86400000);
        return days >= 364 ? 'ANUAL' : 'MENSUAL';
    }
    async evaluateMemberAccess(member) {
        const today = (0, madrid_week_util_1.todayYmdMadrid)();
        if (member.activated !== 1) {
            return {
                valid: false,
                status: 'NO_ACTIVO',
                message: 'La cuenta del socio no está activada.',
                due_date: null,
                cycle_type: '',
                days_remaining: null,
                days_overdue: null,
            };
        }
        const st = (member.membership_status ?? '').trim().toLowerCase();
        if (st === 'expired') {
            return {
                valid: false,
                status: 'VENCIDO',
                message: 'Membresía marcada como caducada en el sistema.',
                due_date: isoDateOnly(member.membership_valid_to),
                cycle_type: '',
                days_remaining: null,
                days_overdue: null,
            };
        }
        const pay = await this.latestPaymentEnd(member.id);
        let dueDate = pay.end;
        if (!dueDate) {
            dueDate = isoDateOnly(member.membership_valid_to);
        }
        const vf = isoDateOnly(member.membership_valid_from);
        const vt = isoDateOnly(member.membership_valid_to);
        if (vf && today < vf) {
            return {
                valid: false,
                status: 'NO_INICIADA',
                message: `La vigencia en ficha aún no ha comenzado (desde ${vf}).`,
                due_date: dueDate,
                cycle_type: this.cycleTypeFromRange(pay.start, pay.end),
                days_remaining: null,
                days_overdue: null,
            };
        }
        if (vt && today > vt) {
            const overdue = Math.floor((Date.parse(today + 'T12:00:00') -
                Date.parse(vt + 'T12:00:00')) /
                86400000);
            return {
                valid: false,
                status: 'VENCIDO',
                message: `Fuera del periodo en ficha (hasta ${vt}). Renueva o actualiza fechas.`,
                due_date: dueDate,
                cycle_type: this.cycleTypeFromRange(pay.start, pay.end),
                days_remaining: null,
                days_overdue: overdue > 0 ? overdue : null,
            };
        }
        if (!dueDate) {
            return {
                valid: false,
                status: 'SIN_VIGENCIA',
                message: 'No hay fecha de vencimiento configurada (ni cobro con fin ni vigencia en ficha).',
                due_date: null,
                cycle_type: '',
                days_remaining: null,
                days_overdue: null,
            };
        }
        const diffDays = Math.floor((Date.parse(dueDate + 'T12:00:00') - Date.parse(today + 'T12:00:00')) /
            86400000);
        const cycle_type = this.cycleTypeFromRange(pay.start, pay.end);
        if (diffDays >= 0) {
            return {
                valid: true,
                status: 'PERMITIDO',
                message: diffDays === 0
                    ? 'Pago al día. Vence hoy.'
                    : `Pago al día. Restan ${diffDays} día(s) hasta el vencimiento.`,
                due_date: dueDate,
                cycle_type,
                days_remaining: diffDays,
                days_overdue: null,
            };
        }
        return {
            valid: false,
            status: 'VENCIDO',
            message: `Pago vencido hace ${Math.abs(diffDays)} día(s).`,
            due_date: dueDate,
            cycle_type,
            days_remaining: null,
            days_overdue: Math.abs(diffDays),
        };
    }
    async alreadyAllowedToday(memberId, accessDate) {
        const n = await this.logs
            .createQueryBuilder('l')
            .where('l.member_id = :id', { id: memberId })
            .andWhere('l.access_date = :d', { d: accessDate })
            .andWhere("l.outcome = 'allowed'")
            .getCount();
        return n > 0;
    }
    async checkAndRecord(actor, lookupRaw, record) {
        const accessDate = (0, madrid_week_util_1.todayYmdMadrid)();
        const trimmed = lookupRaw.trim();
        const baseEmpty = () => ({
            valid: false,
            status: 'NO_ENCONTRADO',
            message: 'Indica un identificador (nº interno, código de socio o DNI).',
            member_numeric_id: null,
            member_code: null,
            di_dni_type: null,
            di_dni_number: null,
            first_name: null,
            last_name: null,
            image: null,
            cycle_type: '',
            days_remaining: null,
            days_overdue: null,
            due_date: null,
            recorded: false,
        });
        if (!trimmed) {
            return baseEmpty();
        }
        const persist = async (partial) => {
            if (!record)
                return;
            try {
                const row = this.logs.create({
                    member_id: partial.member_id,
                    access_date: accessDate,
                    access_at: new Date(),
                    staff_actor_id: actor.userId,
                    outcome: partial.outcome,
                    status_display: partial.status_display,
                    lookup_raw: trimmed.slice(0, 160),
                    due_date_snapshot: partial.due_date_snapshot ?? null,
                    days_remaining: partial.days_remaining ?? null,
                    days_overdue: partial.days_overdue ?? null,
                });
                await this.logs.save(row);
            }
            catch (e) {
                this.logger.warn(`No se pudo guardar club_access_log: ${e instanceof Error ? e.message : e}`);
            }
        };
        const member = await this.findMemberByLookup(trimmed);
        if (!member) {
            await persist({
                outcome: 'denied_not_found',
                status_display: 'NO_ENCONTRADO',
                member_id: null,
                due_date_snapshot: null,
                days_remaining: null,
                days_overdue: null,
            });
            return {
                ...baseEmpty(),
                message: 'No se encontró un socio con ese ID, código o DNI.',
                recorded: record,
            };
        }
        try {
            await this.assertStaffMayViewMember(actor, member);
        }
        catch (e) {
            if (e instanceof common_1.ForbiddenException) {
                await persist({
                    outcome: 'denied_forbidden_staff',
                    status_display: 'SIN_PERMISO',
                    member_id: member.id,
                    due_date_snapshot: null,
                    days_remaining: null,
                    days_overdue: null,
                });
                throw e;
            }
            throw e;
        }
        const normR = normRole(member.role_name);
        if (normR !== 'member') {
            await persist({
                outcome: 'denied_not_member',
                status_display: 'NO_SOCIO',
                member_id: member.id,
                due_date_snapshot: null,
                days_remaining: null,
                days_overdue: null,
            });
            return {
                valid: false,
                status: 'NO_SOCIO',
                message: 'Este identificador no corresponde a un rol de socio.',
                member_numeric_id: member.id,
                member_code: member.member_id,
                di_dni_type: member.di_dni_type,
                di_dni_number: member.di_dni_number,
                first_name: member.first_name,
                last_name: member.last_name,
                image: member.image,
                cycle_type: '',
                days_remaining: null,
                days_overdue: null,
                due_date: null,
                recorded: record,
            };
        }
        const ev = await this.evaluateMemberAccess(member);
        if (!ev.valid) {
            await persist({
                outcome: ev.status === 'NO_ACTIVO'
                    ? 'denied_inactive'
                    : ev.status === 'SIN_VIGENCIA'
                        ? 'denied_no_due'
                        : ev.status === 'NO_INICIADA'
                            ? 'denied_not_started'
                            : 'denied_expired',
                status_display: ev.status,
                member_id: member.id,
                due_date_snapshot: ev.due_date,
                days_remaining: ev.days_remaining,
                days_overdue: ev.days_overdue,
            });
            return {
                valid: false,
                status: ev.status,
                message: ev.message,
                member_numeric_id: member.id,
                member_code: member.member_id,
                di_dni_type: member.di_dni_type,
                di_dni_number: member.di_dni_number,
                first_name: member.first_name,
                last_name: member.last_name,
                image: member.image,
                cycle_type: ev.cycle_type,
                days_remaining: ev.days_remaining,
                days_overdue: ev.days_overdue,
                due_date: ev.due_date,
                recorded: record,
            };
        }
        if (await this.alreadyAllowedToday(member.id, accessDate)) {
            await persist({
                outcome: 'duplicate_daily',
                status_display: 'DUPLICADO_HOY',
                member_id: member.id,
                due_date_snapshot: ev.due_date,
                days_remaining: ev.days_remaining,
                days_overdue: null,
            });
            return {
                valid: false,
                status: 'DUPLICADO_HOY',
                message: 'La entrada de hoy ya estaba registrada para este socio.',
                member_numeric_id: member.id,
                member_code: member.member_id,
                di_dni_type: member.di_dni_type,
                di_dni_number: member.di_dni_number,
                first_name: member.first_name,
                last_name: member.last_name,
                image: member.image,
                cycle_type: ev.cycle_type,
                days_remaining: ev.days_remaining,
                days_overdue: null,
                due_date: ev.due_date,
                recorded: record,
            };
        }
        await persist({
            outcome: 'allowed',
            status_display: 'PERMITIDO',
            member_id: member.id,
            due_date_snapshot: ev.due_date,
            days_remaining: ev.days_remaining,
            days_overdue: null,
        });
        return {
            valid: true,
            status: ev.status,
            message: ev.message,
            member_numeric_id: member.id,
            member_code: member.member_id,
            di_dni_type: member.di_dni_type,
            di_dni_number: member.di_dni_number,
            first_name: member.first_name,
            last_name: member.last_name,
            image: member.image,
            cycle_type: ev.cycle_type,
            days_remaining: ev.days_remaining,
            days_overdue: null,
            due_date: ev.due_date,
            recorded: record,
        };
    }
    isYmd(s) {
        return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
    }
    async recentLogs(limit, fromYmd, toYmd) {
        const take = Math.min(Math.max(limit, 1), 500);
        const qb = this.logs
            .createQueryBuilder('l')
            .leftJoin(gym_member_entity_1.GymMember, 'm', 'm.id = l.member_id')
            .leftJoin(gym_member_entity_1.GymMember, 's', 's.id = l.staff_actor_id')
            .select([
            'l.id AS id',
            'l.access_at AS access_at',
            'l.access_date AS access_date',
            'l.outcome AS outcome',
            'l.status_display AS status_display',
            'l.lookup_raw AS lookup_raw',
            'l.member_id AS member_id',
            'm.first_name AS first_name',
            'm.last_name AS last_name',
            's.first_name AS staff_first_name',
            's.last_name AS staff_last_name',
        ]);
        let from = this.isYmd(fromYmd) ? fromYmd : null;
        let to = this.isYmd(toYmd) ? toYmd : null;
        if (from && to && from > to) {
            const t = from;
            from = to;
            to = t;
        }
        if (from) {
            qb.andWhere('l.access_date >= :fromD', { fromD: from });
        }
        if (to) {
            qb.andWhere('l.access_date <= :toD', { toD: to });
        }
        const rows = await qb
            .orderBy('l.id', 'DESC')
            .take(take)
            .getRawMany();
        return rows.map((r) => ({
            id: r.id,
            access_at: r.access_at instanceof Date
                ? r.access_at.toISOString()
                : String(r.access_at),
            access_date: isoDateOnly(r.access_date) ?? String(r.access_date),
            outcome: r.outcome,
            status_display: r.status_display,
            lookup_raw: r.lookup_raw,
            member_id: r.member_id,
            first_name: r.first_name,
            last_name: r.last_name,
            staff_first_name: r.staff_first_name,
            staff_last_name: r.staff_last_name,
        }));
    }
};
exports.AccessControlService = AccessControlService;
exports.AccessControlService = AccessControlService = AccessControlService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(general_setting_entity_1.GeneralSetting)),
    __param(1, (0, typeorm_1.InjectRepository)(gym_member_entity_1.GymMember)),
    __param(2, (0, typeorm_1.InjectRepository)(membership_payment_entity_1.MembershipPayment)),
    __param(3, (0, typeorm_1.InjectRepository)(club_access_log_entity_1.ClubAccessLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AccessControlService);
//# sourceMappingURL=access-control.service.js.map