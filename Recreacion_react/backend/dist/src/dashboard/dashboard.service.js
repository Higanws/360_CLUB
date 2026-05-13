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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const club_access_log_entity_1 = require("../entities/club-access-log.entity");
const gym_member_entity_1 = require("../entities/gym-member.entity");
const membership_payment_entity_1 = require("../entities/membership-payment.entity");
const membership_entity_1 = require("../entities/membership.entity");
const activity_entity_1 = require("../entities/activity.entity");
const training_routine_entity_1 = require("../entities/training-routine.entity");
const pos_product_entity_1 = require("../entities/pos-product.entity");
const pos_sale_entity_1 = require("../entities/pos-sale.entity");
const nutrition_plan_entity_1 = require("../entities/nutrition-plan.entity");
function ymdLocal(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function addDaysLocal(ymd, delta) {
    const [y, mo, da] = ymd.split('-').map((x) => parseInt(x, 10));
    const d = new Date(y, mo - 1, da);
    d.setDate(d.getDate() + delta);
    return ymdLocal(d);
}
let DashboardService = class DashboardService {
    constructor(ds) {
        this.ds = ds;
    }
    async getBusinessMetrics() {
        const memberRepo = this.ds.getRepository(gym_member_entity_1.GymMember);
        const members = await memberRepo
            .createQueryBuilder('m')
            .where("LOWER(TRIM(m.role_name)) = 'member'")
            .getCount();
        const staff = await memberRepo
            .createQueryBuilder('m')
            .where("LOWER(TRIM(m.role_name)) = 'staff_member'")
            .getCount();
        const active_members = await memberRepo
            .createQueryBuilder('m')
            .where("LOWER(TRIM(m.role_name)) = 'member'")
            .andWhere('m.activated = 1')
            .getCount();
        const [membership_plans, catalog_products, exercises, training_routines, nutrition_plans,] = await Promise.all([
            this.ds.getRepository(membership_entity_1.Membership).createQueryBuilder('x').getCount(),
            this.ds.getRepository(pos_product_entity_1.PosProduct).createQueryBuilder('x').getCount(),
            this.ds.getRepository(activity_entity_1.Activity).createQueryBuilder('x').getCount(),
            this.ds.getRepository(training_routine_entity_1.TrainingRoutine).createQueryBuilder('x').getCount(),
            this.ds.getRepository(nutrition_plan_entity_1.NutritionPlan).createQueryBuilder('x').getCount(),
        ]);
        const debtRow = await this.ds
            .getRepository(membership_payment_entity_1.MembershipPayment)
            .createQueryBuilder('mp')
            .select('COALESCE(SUM(GREATEST(0, COALESCE(mp.membership_amount, 0) - COALESCE(mp.paid_amount, 0))), 0)', 'total_owed')
            .addSelect('SUM(CASE WHEN COALESCE(mp.membership_amount, 0) > COALESCE(mp.paid_amount, 0) THEN 1 ELSE 0 END)', 'pending_invoices')
            .getRawOne();
        const totalOwed = Number(debtRow?.total_owed ?? 0);
        const pendingInvoices = Number(debtRow?.pending_invoices ?? 0);
        const today = ymdLocal(new Date());
        const from30 = addDaysLocal(today, -29);
        const from14 = addDaysLocal(today, -13);
        const saleAgg = await this.ds
            .getRepository(pos_sale_entity_1.PosSale)
            .createQueryBuilder('s')
            .select('DATE(s.created_at)', 'd')
            .addSelect('COUNT(s.id)', 'cnt')
            .addSelect('COALESCE(SUM(s.total_amount), 0)', 'rev')
            .where('DATE(s.created_at) >= :from', { from: from30 })
            .andWhere('DATE(s.created_at) <= :to', { to: today })
            .groupBy('DATE(s.created_at)')
            .orderBy('d', 'ASC')
            .getRawMany();
        const saleMap = new Map();
        for (const r of saleAgg) {
            const key = r.d instanceof Date ? r.d.toISOString().slice(0, 10) : String(r.d).slice(0, 10);
            saleMap.set(key, {
                revenue: Number(r.rev),
                sales_count: Number(r.cnt),
            });
        }
        const sales_last_30d = [];
        for (let i = 0; i < 30; i++) {
            const date = addDaysLocal(from30, i);
            const v = saleMap.get(date) ?? { revenue: 0, sales_count: 0 };
            sales_last_30d.push({ date, ...v });
        }
        const accessAgg = await this.ds
            .getRepository(club_access_log_entity_1.ClubAccessLog)
            .createQueryBuilder('l')
            .select('l.access_date', 'd')
            .addSelect("SUM(CASE WHEN l.outcome = 'allowed' THEN 1 ELSE 0 END)", 'allowed_cnt')
            .addSelect("SUM(CASE WHEN l.outcome <> 'allowed' THEN 1 ELSE 0 END)", 'denied_cnt')
            .where('l.access_date >= :from', { from: from14 })
            .andWhere('l.access_date <= :to', { to: today })
            .groupBy('l.access_date')
            .orderBy('l.access_date', 'ASC')
            .getRawMany();
        const accessMap = new Map();
        for (const r of accessAgg) {
            const key = r.d instanceof Date ? r.d.toISOString().slice(0, 10) : String(r.d).slice(0, 10);
            accessMap.set(key, {
                allowed: Number(r.allowed_cnt),
                denied: Number(r.denied_cnt),
            });
        }
        const access_last_14d = [];
        for (let i = 0; i < 14; i++) {
            const date = addDaysLocal(from14, i);
            const v = accessMap.get(date) ?? { allowed: 0, denied: 0 };
            access_last_14d.push({ date, ...v });
        }
        return {
            generated_at: new Date().toISOString(),
            summary: {
                members,
                staff,
                active_members,
                membership_plans,
                catalog_products,
                exercises,
                training_routines,
                nutrition_plans,
            },
            membership_debt: {
                pending_invoices: pendingInvoices,
                total_owed: totalOwed,
            },
            sales_last_30d,
            access_last_14d,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map