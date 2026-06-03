import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  CACHE_KEYS,
  CACHE_TTL,
} from '../shared/cache/cache-ttl';
import { CLUB_ROLES } from '../shared/domain/club/club-roles';
import {
  GYM_MEMBER_READ,
  type GymMemberReadRepository,
} from '../shared/application/ports/gym-member-read.port';
import { ClubAccessLog } from '../entities/club-access-log.entity';
import { MembershipPayment } from '../entities/membership-payment.entity';
import { Membership } from '../entities/membership.entity';
import { Activity } from '../entities/activity.entity';
import { TrainingRoutine } from '../entities/training-routine.entity';
import { PosProduct } from '../entities/pos-product.entity';
import { PosSale } from '../entities/pos-sale.entity';
import { NutritionPlan } from '../entities/nutrition-plan.entity';

export type DashboardBusinessMetrics = {
  generated_at: string;
  summary: {
    members: number;
    staff: number;
    active_members: number;
    membership_plans: number;
    catalog_products: number;
    exercises: number;
    training_routines: number;
    nutrition_plans: number;
  };
  membership_debt: {
    pending_invoices: number;
    total_owed: number;
  };
  sales_last_30d: Array<{
    date: string;
    revenue: number;
    sales_count: number;
  }>;
  access_last_14d: Array<{
    date: string;
    allowed: number;
    denied: number;
  }>;
};

function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysLocal(ymd: string, delta: number): string {
  const [y, mo, da] = ymd.split('-').map((x) => parseInt(x, 10));
  const d = new Date(y, mo - 1, da);
  d.setDate(d.getDate() + delta);
  return ymdLocal(d);
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    @Inject(GYM_MEMBER_READ) private readonly memberRead: GymMemberReadRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getBusinessMetrics(): Promise<DashboardBusinessMetrics> {
    const cached = await this.cache.get<DashboardBusinessMetrics>(
      CACHE_KEYS.DASHBOARD_BUSINESS_METRICS,
    );
    if (cached) return cached;

    const result = await this.computeBusinessMetrics();
    await this.cache.set(
      CACHE_KEYS.DASHBOARD_BUSINESS_METRICS,
      result,
      CACHE_TTL.DASHBOARD_METRICS,
    );
    return result;
  }

  private async computeBusinessMetrics(): Promise<DashboardBusinessMetrics> {
    const [members, staff, active_members] = await Promise.all([
      this.memberRead.countByRole(CLUB_ROLES.MEMBER),
      this.memberRead.countByRole(CLUB_ROLES.STAFF),
      this.memberRead.countActiveMembers(),
    ]);

    const [
      membership_plans,
      catalog_products,
      exercises,
      training_routines,
      nutrition_plans,
    ] = await Promise.all([
      this.ds.getRepository(Membership).createQueryBuilder('x').getCount(),
      this.ds.getRepository(PosProduct).createQueryBuilder('x').getCount(),
      this.ds.getRepository(Activity).createQueryBuilder('x').getCount(),
      this.ds.getRepository(TrainingRoutine).createQueryBuilder('x').getCount(),
      this.ds.getRepository(NutritionPlan).createQueryBuilder('x').getCount(),
    ]);

    const debtRow = await this.ds
      .getRepository(MembershipPayment)
      .createQueryBuilder('mp')
      .select(
        'COALESCE(SUM(GREATEST(0, COALESCE(mp.membership_amount, 0) - COALESCE(mp.paid_amount, 0))), 0)',
        'total_owed',
      )
      .addSelect(
        'SUM(CASE WHEN COALESCE(mp.membership_amount, 0) > COALESCE(mp.paid_amount, 0) THEN 1 ELSE 0 END)',
        'pending_invoices',
      )
      .getRawOne<{ total_owed: string | number; pending_invoices: string | number }>();

    const totalOwed = Number(debtRow?.total_owed ?? 0);
    const pendingInvoices = Number(debtRow?.pending_invoices ?? 0);

    const today = ymdLocal(new Date());
    const from30 = addDaysLocal(today, -29);
    const from14 = addDaysLocal(today, -13);

    const start30 = new Date(`${from30}T00:00:00.000`);
    const endToday = new Date(`${today}T23:59:59.999`);

    const saleAgg = await this.ds
      .getRepository(PosSale)
      .createQueryBuilder('s')
      .select('DATE(s.created_at)', 'd')
      .addSelect('COUNT(s.id)', 'cnt')
      .addSelect('COALESCE(SUM(s.total_amount), 0)', 'rev')
      .where('s.created_at >= :startTs', { startTs: start30 })
      .andWhere('s.created_at <= :endTs', { endTs: endToday })
      .groupBy('DATE(s.created_at)')
      .orderBy('d', 'ASC')
      .getRawMany<{ d: Date | string; cnt: string | number; rev: string | number }>();

    const saleMap = new Map<string, { revenue: number; sales_count: number }>();
    for (const r of saleAgg) {
      const key =
        r.d instanceof Date ? r.d.toISOString().slice(0, 10) : String(r.d).slice(0, 10);
      saleMap.set(key, {
        revenue: Number(r.rev),
        sales_count: Number(r.cnt),
      });
    }

    const sales_last_30d: DashboardBusinessMetrics['sales_last_30d'] = [];
    for (let i = 0; i < 30; i++) {
      const date = addDaysLocal(from30, i);
      const v = saleMap.get(date) ?? { revenue: 0, sales_count: 0 };
      sales_last_30d.push({ date, ...v });
    }

    const accessAgg = await this.ds
      .getRepository(ClubAccessLog)
      .createQueryBuilder('l')
      .select('l.access_date', 'd')
      .addSelect(
        "SUM(CASE WHEN l.outcome = 'allowed' THEN 1 ELSE 0 END)",
        'allowed_cnt',
      )
      .addSelect(
        "SUM(CASE WHEN l.outcome <> 'allowed' THEN 1 ELSE 0 END)",
        'denied_cnt',
      )
      .where('l.access_date >= :from', { from: from14 })
      .andWhere('l.access_date <= :to', { to: today })
      .groupBy('l.access_date')
      .orderBy('l.access_date', 'ASC')
      .getRawMany<{
        d: Date | string;
        allowed_cnt: string | number;
        denied_cnt: string | number;
      }>();

    const accessMap = new Map<string, { allowed: number; denied: number }>();
    for (const r of accessAgg) {
      const key =
        r.d instanceof Date ? r.d.toISOString().slice(0, 10) : String(r.d).slice(0, 10);
      accessMap.set(key, {
        allowed: Number(r.allowed_cnt),
        denied: Number(r.denied_cnt),
      });
    }

    const access_last_14d: DashboardBusinessMetrics['access_last_14d'] = [];
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
}
