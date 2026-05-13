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
exports.MembershipsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const membership_entity_1 = require("../entities/membership.entity");
const membership_payment_entity_1 = require("../entities/membership-payment.entity");
let MembershipsService = class MembershipsService {
    constructor(plans, payments) {
        this.plans = plans;
        this.payments = payments;
    }
    toRow(m) {
        return {
            id: m.id,
            membership_label: m.membership_label,
            membership_amount: m.membership_amount,
            membership_period_days: m.membership_period_days,
            installment_plan: m.installment_plan,
            signup_fee: m.signup_fee,
            description: m.description,
            image: m.image,
        };
    }
    async list() {
        const rows = await this.plans.find({ order: { id: 'ASC' } });
        return {
            title: 'Lista de membresías',
            subtitle: 'Afiliación',
            memberships: rows.map((m) => this.toRow(m)),
        };
    }
    async findOne(id) {
        const m = await this.plans.findOne({ where: { id } });
        if (!m)
            throw new common_1.NotFoundException('Membresía no encontrada.');
        return this.toRow(m);
    }
    async create(dto) {
        const entity = this.plans.create({
            membership_label: dto.membership_label.trim(),
            membership_amount: dto.membership_amount,
            membership_period_days: dto.membership_period_days ?? null,
            installment_plan: dto.installment_plan?.trim() || null,
            signup_fee: dto.signup_fee ?? null,
            description: dto.description?.trim() || null,
            image: dto.image?.trim() || null,
        });
        const saved = await this.plans.save(entity);
        return this.toRow(saved);
    }
    async update(id, dto) {
        const m = await this.plans.findOne({ where: { id } });
        if (!m)
            throw new common_1.NotFoundException('Membresía no encontrada.');
        if (dto.membership_label !== undefined) {
            m.membership_label = dto.membership_label.trim();
        }
        if (dto.membership_amount !== undefined) {
            m.membership_amount = dto.membership_amount;
        }
        if (dto.membership_period_days !== undefined) {
            m.membership_period_days = dto.membership_period_days;
        }
        if (dto.installment_plan !== undefined) {
            m.installment_plan = dto.installment_plan?.trim() || null;
        }
        if (dto.signup_fee !== undefined) {
            m.signup_fee = dto.signup_fee;
        }
        if (dto.description !== undefined) {
            m.description = dto.description?.trim() || null;
        }
        if (dto.image !== undefined) {
            m.image = dto.image?.trim() || null;
        }
        const saved = await this.plans.save(m);
        return this.toRow(saved);
    }
    async remove(id) {
        const m = await this.plans.findOne({ where: { id } });
        if (!m)
            throw new common_1.NotFoundException('Membresía no encontrada.');
        const cnt = await this.payments.count({
            where: { membership_id: id },
        });
        if (cnt > 0) {
            throw new common_1.BadRequestException('No se puede eliminar esta membresía porque hay pagos o registros asociados.');
        }
        await this.plans.remove(m);
        return { ok: true };
    }
};
exports.MembershipsService = MembershipsService;
exports.MembershipsService = MembershipsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(membership_entity_1.Membership)),
    __param(1, (0, typeorm_1.InjectRepository)(membership_payment_entity_1.MembershipPayment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], MembershipsService);
//# sourceMappingURL=memberships.service.js.map