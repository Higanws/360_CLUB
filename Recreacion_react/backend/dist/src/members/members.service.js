"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt = __importStar(require("bcrypt"));
const typeorm_2 = require("typeorm");
const class_schedule_entity_1 = require("../entities/class-schedule.entity");
const general_setting_entity_1 = require("../entities/general-setting.entity");
const gym_member_class_entity_1 = require("../entities/gym-member-class.entity");
const gym_member_entity_1 = require("../entities/gym-member.entity");
const membership_payment_entity_1 = require("../entities/membership-payment.entity");
const membership_entity_1 = require("../entities/membership.entity");
function isoDateOnly(v) {
    if (v == null)
        return null;
    if (v instanceof Date)
        return v.toISOString().slice(0, 10);
    const s = String(v);
    return s.length >= 10 ? s.slice(0, 10) : s;
}
function numFromDecColumn(s) {
    if (s == null || s === '')
        return null;
    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}
function parseDecimalDto(v) {
    if (v === undefined || v === null || v === '')
        return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    if (!Number.isFinite(n))
        return null;
    return n.toFixed(2);
}
function normRole(r) {
    return (r ?? '').trim().toLowerCase();
}
let MembersService = class MembersService {
    constructor(members, settings, memberClass, membership, membershipPayment, classSchedule) {
        this.members = members;
        this.settings = settings;
        this.memberClass = memberClass;
        this.membership = membership;
        this.membershipPayment = membershipPayment;
        this.classSchedule = classSchedule;
    }
    async settingsRow() {
        return ((await this.settings.find({ take: 1, order: { id: 'ASC' } }))[0] ?? null);
    }
    assertBusinessRole(role_name) {
        const r = normRole(role_name);
        if (r !== 'administrator' && r !== 'staff_member') {
            throw new common_1.ForbiddenException('El módulo de socios es solo para administración o staff del club.');
        }
    }
    memberTypeToStatus(t) {
        switch (t) {
            case 'Member':
                return 'Continue';
            case 'Prospect':
                return 'Not Available';
            case 'Alumni':
                return 'Expired';
            default:
                return 'Not Available';
        }
    }
    formatMemberCode(id) {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        return `M${id}${dd}${yy}`;
    }
    parseOptionalDate(s) {
        if (s == null || s === '')
            return null;
        const d = new Date(s);
        return Number.isNaN(d.getTime()) ? null : d;
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
    async assertUsernameAvailable(username, excludeId) {
        const q = this.members
            .createQueryBuilder('m')
            .where('LOWER(TRIM(m.username)) = LOWER(TRIM(:u))', {
            u: username.trim(),
        });
        if (excludeId != null) {
            q.andWhere('m.id != :id', { id: excludeId });
        }
        const n = await q.getCount();
        if (n > 0) {
            throw new common_1.ConflictException('Ya existe un usuario con ese nombre de acceso.');
        }
    }
    async assertDniAvailable(type, number, excludeId) {
        const t = type.trim().toUpperCase();
        const n = number.trim().toUpperCase().replace(/\s+/g, '');
        const q = this.members
            .createQueryBuilder('m')
            .where('LOWER(TRIM(m.role_name)) = :mr', { mr: 'member' })
            .andWhere('UPPER(TRIM(m.di_dni_type)) = :dt', { dt: t })
            .andWhere('UPPER(TRIM(m.di_dni_number)) = :dn', { dn: n });
        if (excludeId != null) {
            q.andWhere('m.id != :id', { id: excludeId });
        }
        const c = await q.getCount();
        if (c > 0) {
            throw new common_1.ConflictException('Ya existe un socio con ese documento.');
        }
    }
    toSafeDetail(m, assign_class_ids) {
        return {
            id: m.id,
            activated: m.activated,
            member_id: m.member_id,
            di_dni_type: m.di_dni_type,
            di_dni_number: m.di_dni_number,
            first_name: m.first_name,
            last_name: m.last_name,
            gender: m.gender,
            birth_date: isoDateOnly(m.birth_date),
            email: m.email,
            username: m.username,
            mobile: m.mobile,
            phone: m.phone,
            address: m.address,
            city: m.city,
            state: m.state,
            zipcode: m.zipcode,
            image: m.image,
            assign_staff_mem: m.assign_staff_mem,
            selected_membership: m.selected_membership,
            membership_status: m.membership_status,
            membership_valid_from: isoDateOnly(m.membership_valid_from),
            membership_valid_to: isoDateOnly(m.membership_valid_to),
            inquiry_date: isoDateOnly(m.inquiry_date),
            trial_end_date: isoDateOnly(m.trial_end_date),
            first_pay_date: isoDateOnly(m.first_pay_date),
            created_date: isoDateOnly(m.created_date),
            assign_class_ids,
            physical_weight_kg: numFromDecColumn(m.physical_weight_kg),
            physical_height_cm: numFromDecColumn(m.physical_height_cm),
            physical_chest_cm: numFromDecColumn(m.physical_chest_cm),
            physical_waist_cm: numFromDecColumn(m.physical_waist_cm),
            physical_thigh_cm: numFromDecColumn(m.physical_thigh_cm),
            physical_arms_cm: numFromDecColumn(m.physical_arms_cm),
            physical_fat_percent: numFromDecColumn(m.physical_fat_percent),
        };
    }
    async listForUser(payload) {
        const role = normRole(payload.role_name);
        if (role === 'member') {
            throw new common_1.ForbiddenException('Los socios no tienen acceso al módulo de gestión. Contacta con recepción.');
        }
        this.assertBusinessRole(payload.role_name);
        const uid = payload.userId;
        const settingRow = await this.settingsRow();
        const qb = this.members
            .createQueryBuilder('m')
            .select([
            'm.id',
            'm.activated',
            'm.member_id',
            'm.first_name',
            'm.last_name',
            'm.image',
            'm.membership_status',
            'm.membership_valid_from',
            'm.membership_valid_to',
            'm.assign_staff_mem',
        ])
            .where('LOWER(TRIM(m.role_name)) = :memberRole', { memberRole: 'member' });
        if (role === 'administrator') {
        }
        else if (role === 'staff_member') {
            const ownOnly = settingRow?.staff_can_view_own_member === 1;
            if (ownOnly) {
                qb.andWhere('m.assign_staff_mem = :uid', { uid });
            }
        }
        const rows = await qb
            .orderBy('m.first_name', 'ASC')
            .addOrderBy('m.last_name', 'ASC')
            .getMany();
        const mapped = rows.map((r) => ({
            id: r.id,
            activated: r.activated,
            member_id: r.member_id,
            first_name: r.first_name,
            last_name: r.last_name,
            image: r.image,
            membership_status: r.membership_status,
            membership_valid_from: isoDateOnly(r.membership_valid_from),
            membership_valid_to: isoDateOnly(r.membership_valid_to),
        }));
        return {
            title: 'Lista de socios',
            subtitle: 'Socios',
            members: mapped,
            meta: {
                role_name: payload.role_name,
                can_add_member: true,
                show_status_column: role === 'administrator',
                date_format: settingRow?.date_format ?? null,
            },
        };
    }
    async formOptions() {
        const staffRows = await this.members
            .createQueryBuilder('m')
            .select(['m.id', 'm.first_name', 'm.last_name'])
            .where('LOWER(TRIM(m.role_name)) = :r', { r: 'staff_member' })
            .orderBy('m.first_name', 'ASC')
            .getMany();
        const classes = await this.classSchedule.find({
            order: { class_name: 'ASC' },
        });
        const plans = await this.membership.find({
            order: { membership_label: 'ASC' },
        });
        return {
            staff: staffRows.map((s) => ({
                id: s.id,
                label: [s.first_name, s.last_name].filter(Boolean).join(' ').trim(),
            })),
            classes: classes.map((c) => ({
                id: c.id,
                class_name: c.class_name,
            })),
            memberships: plans.map((p) => ({
                id: p.id,
                membership_label: p.membership_label,
                amount: p.membership_amount,
            })),
        };
    }
    async findOne(id, actor) {
        this.assertBusinessRole(actor.role_name);
        const m = await this.members.findOne({ where: { id } });
        if (!m || normRole(m.role_name) !== 'member') {
            throw new common_1.NotFoundException('Socio no encontrado.');
        }
        await this.assertCanManageMember(actor, m);
        const cls = await this.memberClass.find({
            where: { member_id: id },
            order: { id: 'ASC' },
        });
        const ids = cls
            .map((c) => c.assign_class)
            .filter((x) => x != null);
        return { member: this.toSafeDetail(m, ids) };
    }
    async create(dto, actor) {
        this.assertBusinessRole(actor.role_name);
        await this.assertUsernameAvailable(dto.username);
        await this.assertDniAvailable(dto.di_dni_type, dto.di_dni_number);
        const membership_status = this.memberTypeToStatus('Member');
        const hash = await bcrypt.hash(dto.password, 10);
        const row = this.members.create({
            role_name: 'member',
            first_name: dto.first_name.trim(),
            last_name: dto.last_name.trim(),
            username: dto.username.trim(),
            password: hash,
            email: dto.email?.trim() || null,
            mobile: dto.mobile?.trim() || null,
            phone: dto.phone?.trim() || null,
            gender: dto.gender,
            birth_date: this.parseOptionalDate(dto.birth_date),
            address: dto.address?.trim() || null,
            city: dto.city?.trim() || null,
            state: dto.state?.trim() || null,
            zipcode: dto.zipcode?.trim() || null,
            di_dni_type: dto.di_dni_type.trim().toUpperCase(),
            di_dni_number: dto.di_dni_number.trim().toUpperCase().replace(/\s+/g, ''),
            member_type: 'Member',
            membership_status,
            membership_valid_from: this.parseOptionalDate(dto.membership_valid_from),
            membership_valid_to: this.parseOptionalDate(dto.membership_valid_to),
            selected_membership: dto.selected_membership?.trim() || null,
            assign_staff_mem: dto.assign_staff_mem ?? null,
            activated: dto.activated ?? 1,
            image: 'Thumbnail-img.png',
            created_date: new Date(),
            created_by: actor.userId,
            physical_weight_kg: parseDecimalDto(dto.physical_weight_kg),
            physical_height_cm: parseDecimalDto(dto.physical_height_cm),
            physical_chest_cm: parseDecimalDto(dto.physical_chest_cm),
            physical_waist_cm: parseDecimalDto(dto.physical_waist_cm),
            physical_thigh_cm: parseDecimalDto(dto.physical_thigh_cm),
            physical_arms_cm: parseDecimalDto(dto.physical_arms_cm),
            physical_fat_percent: parseDecimalDto(dto.physical_fat_percent),
        });
        const saved = await this.members.save(row);
        const member_id = this.formatMemberCode(saved.id);
        await this.members.update({ id: saved.id }, { member_id });
        await this.replaceClassAssignments(saved.id, dto.assign_class_ids ?? []);
        await this.insertMembershipPaymentIfNeeded(saved.id, dto.selected_membership, membership_status, dto.membership_valid_from, dto.membership_valid_to, actor.userId);
        const fresh = await this.members.findOne({ where: { id: saved.id } });
        if (!fresh)
            throw new common_1.NotFoundException();
        const cls = await this.memberClass.find({ where: { member_id: saved.id } });
        const ids = cls
            .map((c) => c.assign_class)
            .filter((x) => x != null);
        return { member: this.toSafeDetail(fresh, ids) };
    }
    async replaceClassAssignments(memberId, classIds) {
        await this.memberClass.delete({ member_id: memberId });
        const uniq = [...new Set(classIds)].filter((id) => id > 0);
        for (const assign_class of uniq) {
            await this.memberClass.save(this.memberClass.create({ member_id: memberId, assign_class }));
        }
    }
    async insertMembershipPaymentIfNeeded(memberId, selectedMembership, membership_status, start, end, createdBy) {
        if (!selectedMembership?.trim())
            return;
        const mid = parseInt(selectedMembership.trim(), 10);
        if (Number.isNaN(mid) || mid < 1)
            return;
        const plan = await this.membership.findOne({ where: { id: mid } });
        if (!plan)
            return;
        const row = this.membershipPayment.create({
            member_id: memberId,
            membership_id: mid,
            membership_amount: plan.membership_amount ?? 0,
            paid_amount: 0,
            start_date: this.parseOptionalDate(start) ?? new Date(),
            end_date: this.parseOptionalDate(end),
            membership_status,
            payment_status: '0',
            created_date: new Date(),
            created_by: createdBy,
        });
        await this.membershipPayment.save(row);
    }
    async update(id, dto, actor) {
        this.assertBusinessRole(actor.role_name);
        const m = await this.members.findOne({ where: { id } });
        if (!m || normRole(m.role_name) !== 'member') {
            throw new common_1.NotFoundException('Socio no encontrado.');
        }
        await this.assertCanManageMember(actor, m);
        if (dto.username !== undefined) {
            await this.assertUsernameAvailable(dto.username, id);
        }
        const nextDniType = dto.di_dni_type ?? m.di_dni_type;
        const nextDniNum = dto.di_dni_number ?? m.di_dni_number;
        if (dto.di_dni_type !== undefined || dto.di_dni_number !== undefined) {
            if (nextDniType && nextDniNum) {
                await this.assertDniAvailable(nextDniType, nextDniNum, id);
            }
        }
        if (dto.password !== undefined && dto.password.length > 0) {
            m.password = await bcrypt.hash(dto.password, 10);
        }
        if (dto.first_name !== undefined)
            m.first_name = dto.first_name.trim();
        if (dto.last_name !== undefined)
            m.last_name = dto.last_name.trim();
        if (dto.username !== undefined)
            m.username = dto.username.trim();
        if (dto.email !== undefined)
            m.email = dto.email?.trim() || null;
        if (dto.mobile !== undefined)
            m.mobile = dto.mobile?.trim() || null;
        if (dto.phone !== undefined)
            m.phone = dto.phone?.trim() || null;
        if (dto.gender !== undefined)
            m.gender = dto.gender;
        if (dto.birth_date !== undefined)
            m.birth_date = this.parseOptionalDate(dto.birth_date);
        if (dto.address !== undefined)
            m.address = dto.address?.trim() || null;
        if (dto.city !== undefined)
            m.city = dto.city?.trim() || null;
        if (dto.state !== undefined)
            m.state = dto.state?.trim() || null;
        if (dto.zipcode !== undefined)
            m.zipcode = dto.zipcode?.trim() || null;
        if (dto.di_dni_type !== undefined)
            m.di_dni_type = dto.di_dni_type.trim().toUpperCase();
        if (dto.di_dni_number !== undefined)
            m.di_dni_number = dto.di_dni_number
                .trim()
                .toUpperCase()
                .replace(/\s+/g, '');
        if (dto.membership_valid_from !== undefined)
            m.membership_valid_from = this.parseOptionalDate(dto.membership_valid_from);
        if (dto.membership_valid_to !== undefined)
            m.membership_valid_to = this.parseOptionalDate(dto.membership_valid_to);
        if (dto.selected_membership !== undefined)
            m.selected_membership = dto.selected_membership?.trim() || null;
        if (dto.assign_staff_mem !== undefined)
            m.assign_staff_mem = dto.assign_staff_mem ?? null;
        if (dto.activated !== undefined)
            m.activated = dto.activated;
        if (dto.physical_weight_kg !== undefined)
            m.physical_weight_kg = parseDecimalDto(dto.physical_weight_kg);
        if (dto.physical_height_cm !== undefined)
            m.physical_height_cm = parseDecimalDto(dto.physical_height_cm);
        if (dto.physical_chest_cm !== undefined)
            m.physical_chest_cm = parseDecimalDto(dto.physical_chest_cm);
        if (dto.physical_waist_cm !== undefined)
            m.physical_waist_cm = parseDecimalDto(dto.physical_waist_cm);
        if (dto.physical_thigh_cm !== undefined)
            m.physical_thigh_cm = parseDecimalDto(dto.physical_thigh_cm);
        if (dto.physical_arms_cm !== undefined)
            m.physical_arms_cm = parseDecimalDto(dto.physical_arms_cm);
        if (dto.physical_fat_percent !== undefined)
            m.physical_fat_percent = parseDecimalDto(dto.physical_fat_percent);
        await this.members.save(m);
        if (dto.assign_class_ids !== undefined) {
            await this.replaceClassAssignments(id, dto.assign_class_ids);
        }
        const fresh = await this.members.findOne({ where: { id } });
        if (!fresh)
            throw new common_1.NotFoundException();
        const cls = await this.memberClass.find({ where: { member_id: id } });
        const ids = cls
            .map((c) => c.assign_class)
            .filter((x) => x != null);
        return { member: this.toSafeDetail(fresh, ids) };
    }
    async remove(id, actor) {
        this.assertBusinessRole(actor.role_name);
        const m = await this.members.findOne({ where: { id } });
        if (!m || normRole(m.role_name) !== 'member') {
            throw new common_1.NotFoundException('Socio no encontrado.');
        }
        await this.assertCanManageMember(actor, m);
        await this.memberClass.delete({ member_id: id });
        await this.membershipPayment.delete({ member_id: id });
        await this.members.delete({ id });
        return { ok: true };
    }
};
exports.MembersService = MembersService;
exports.MembersService = MembersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(gym_member_entity_1.GymMember)),
    __param(1, (0, typeorm_1.InjectRepository)(general_setting_entity_1.GeneralSetting)),
    __param(2, (0, typeorm_1.InjectRepository)(gym_member_class_entity_1.GymMemberClass)),
    __param(3, (0, typeorm_1.InjectRepository)(membership_entity_1.Membership)),
    __param(4, (0, typeorm_1.InjectRepository)(membership_payment_entity_1.MembershipPayment)),
    __param(5, (0, typeorm_1.InjectRepository)(class_schedule_entity_1.ClassSchedule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MembersService);
//# sourceMappingURL=members.service.js.map