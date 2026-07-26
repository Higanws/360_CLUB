import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { normalizeClubRole } from '../shared/domain/club/club-roles';
import {
  buildPageMeta,
  paginationSkip,
} from '../shared/dto/paginated-meta';
import { ManualMembershipPaymentDto } from './dto/manual-membership-payment.dto';
import { DashboardCacheService } from '../shared/cache/dashboard-cache.service';

export type ExpiringPaymentRow = {
  mp_id: number;
  member_id: number | null;
  membership_id: number | null;
  membership_label: string | null;
  member_name: string;
  membership_amount: number;
  paid_amount: number;
  amount_owed: number;
  start_date: string | null;
  end_date: string | null;
  payment_status: string | null;
  membership_status: string | null;
};

function padIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type ExpiringRawRow = {
  mp_id: number | bigint;
  member_id: number | bigint | null;
  membership_id: number | bigint | null;
  membership_amount: number | string | null;
  paid_amount: number | string | null;
  start_date: Date | string | null;
  end_date: Date | string | null;
  payment_status: string | null;
  membership_status: string | null;
  first_name: string | null;
  last_name: string | null;
  membership_label: string | null;
};

@Injectable()
export class MembershipPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardCache: DashboardCacheService,
  ) {}

  private async settingsRow() {
    return this.prisma.generalSetting.findFirst({ orderBy: { id: 'asc' } });
  }

  /** Lista membresías (filas membership_payment) con fin de vigencia en el mes calendario actual. */
  async listExpiringThisMonth(
    actor: { userId: number; role_name: string },
    page = 1,
    pageSize = 25,
  ): Promise<{
    title: string;
    subtitle: string;
    rows: ExpiringPaymentRow[];
    meta: ReturnType<typeof buildPageMeta>;
  }> {
    const r = normalizeClubRole(actor.role_name);
    if (r !== 'administrator' && r !== 'staff_member') {
      throw new ForbiddenException(
        'Solo administración o staff puede ver cobros de membresía.',
      );
    }

    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const monthStart = padIsoDate(new Date(y, m, 1));
    const monthEnd = padIsoDate(new Date(y, m + 1, 0));

    const settingRow = await this.settingsRow();
    const ownOnly =
      r === 'staff_member' && settingRow?.staff_can_view_own_member === 1;

    const conditions = [
      Prisma.sql`mp.end_date IS NOT NULL`,
      Prisma.sql`mp.end_date >= ${monthStart}`,
      Prisma.sql`mp.end_date <= ${monthEnd}`,
    ];
    if (ownOnly) {
      conditions.push(Prisma.sql`gm.assign_staff_mem = ${actor.userId}`);
    }
    const whereSql = Prisma.join(conditions, ' AND ');

    const ps = Math.min(100, Math.max(1, pageSize));
    const pg = Math.max(1, page);

    const countRows = await this.prisma.$queryRaw<Array<{ cnt: bigint | number }>>`
      SELECT COUNT(*) AS cnt
      FROM membership_payment mp
      LEFT JOIN gym_member gm ON gm.id = mp.member_id
      LEFT JOIN membership plan ON plan.id = mp.membership_id
      WHERE ${whereSql}
    `;
    const total = Number(countRows[0]?.cnt ?? 0);

    const raw = await this.prisma.$queryRaw<ExpiringRawRow[]>`
      SELECT mp.mp_id AS mp_id,
        mp.member_id AS member_id,
        mp.membership_id AS membership_id,
        mp.membership_amount AS membership_amount,
        mp.paid_amount AS paid_amount,
        mp.start_date AS start_date,
        mp.end_date AS end_date,
        mp.payment_status AS payment_status,
        mp.membership_status AS membership_status,
        gm.first_name AS first_name,
        gm.last_name AS last_name,
        plan.membership_label AS membership_label
      FROM membership_payment mp
      LEFT JOIN gym_member gm ON gm.id = mp.member_id
      LEFT JOIN membership plan ON plan.id = mp.membership_id
      WHERE ${whereSql}
      ORDER BY mp.end_date ASC, mp.mp_id ASC
      LIMIT ${ps} OFFSET ${paginationSkip(pg, ps)}
    `;

    const rows: ExpiringPaymentRow[] = raw.map((row) => {
      const total = Number(row.membership_amount ?? 0);
      const paid = Number(row.paid_amount ?? 0);
      const owed = Math.max(0, total - paid);
      const fn = row.first_name ?? '';
      const ln = row.last_name ?? '';
      const member_name = [fn, ln].filter(Boolean).join(' ').trim() || '—';
      return {
        mp_id: Number(row.mp_id),
        member_id: row.member_id != null ? Number(row.member_id) : null,
        membership_id:
          row.membership_id != null ? Number(row.membership_id) : null,
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
      meta: buildPageMeta(total, pg, ps),
    };
  }

  /** Opciones para el formulario de registro manual. */
  async manualFormOptions(
    actor: { userId: number; role_name: string },
    q?: string,
    limit = 20,
  ): Promise<{
    members: { id: number; label: string }[];
    memberships: { id: number; label: string | null; amount: number | null }[];
  }> {
    const r = normalizeClubRole(actor.role_name);
    if (r !== 'administrator' && r !== 'staff_member') {
      throw new ForbiddenException(
        'Solo administración o staff puede registrar cobros.',
      );
    }

    const plans = await this.prisma.membership.findMany({
      orderBy: { membership_label: 'asc' },
    });

    const qTrim = q?.trim() ?? '';
    if (!qTrim) {
      return {
        members: [],
        memberships: plans.map((p) => ({
          id: p.id,
          label: p.membership_label,
          amount: p.membership_amount ?? null,
        })),
      };
    }

    const settingRow = await this.settingsRow();
    const ownOnly =
      r === 'staff_member' && settingRow?.staff_can_view_own_member === 1;

    const take = Math.min(50, Math.max(1, limit));

    const memRows = await this.prisma.gymMember.findMany({
      where: {
        role_name: 'member',
        OR: [
          { first_name: { contains: qTrim } },
          { last_name: { contains: qTrim } },
        ],
        ...(ownOnly ? { assign_staff_mem: actor.userId } : {}),
      },
      select: { id: true, first_name: true, last_name: true },
      orderBy: { first_name: 'asc' },
      take,
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

  async registerManual(
    dto: ManualMembershipPaymentDto,
    actor: { userId: number; role_name: string },
  ): Promise<{ ok: true; mp_id: number }> {
    const r = normalizeClubRole(actor.role_name);
    if (r !== 'administrator' && r !== 'staff_member') {
      throw new ForbiddenException(
        'Solo administración o staff puede registrar cobros.',
      );
    }

    const member = await this.prisma.gymMember.findUnique({
      where: { id: dto.member_id },
    });
    if (!member || normalizeClubRole(member.role_name) !== 'member') {
      throw new NotFoundException('Socio no encontrado.');
    }

    const settingRow = await this.settingsRow();
    const ownOnly =
      r === 'staff_member' && settingRow?.staff_can_view_own_member === 1;
    if (
      ownOnly &&
      member.assign_staff_mem != null &&
      member.assign_staff_mem !== actor.userId
    ) {
      throw new ForbiddenException(
        'No puedes registrar cobros para socios que no tienes asignados.',
      );
    }

    const plan = await this.prisma.membership.findUnique({
      where: { id: dto.membership_id },
    });
    if (!plan) {
      throw new NotFoundException('Plan de membresía no encontrado.');
    }

    const total = dto.membership_amount ?? plan.membership_amount ?? 0;
    if (total < 0 || dto.paid_amount < 0) {
      throw new BadRequestException('Importes no válidos.');
    }

    const start = new Date(dto.start_date);
    const end = new Date(dto.end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Fechas no válidas.');
    }

    const membership_status =
      dto.paid_amount >= total ? 'Continue' : 'Not Available';

    const saved = await this.prisma.membershipPayment.create({
      data: {
        member_id: dto.member_id,
        membership_id: dto.membership_id,
        membership_amount: total,
        paid_amount: dto.paid_amount,
        start_date: new Date(dto.start_date.slice(0, 10)),
        end_date: new Date(dto.end_date.slice(0, 10)),
        membership_status,
        payment_status: dto.paid_amount >= total ? '1' : '0',
        created_date: new Date(),
        created_by: actor.userId,
      },
    });
    await this.dashboardCache.invalidateBusinessMetrics();
    return { ok: true, mp_id: saved.mp_id };
  }

  /** Marca el cobro como cubierto al total del importe del registro. */
  async markPaid(
    mpId: number,
    actor: { userId: number; role_name: string },
  ): Promise<{ ok: true }> {
    const r = normalizeClubRole(actor.role_name);
    if (r !== 'administrator' && r !== 'staff_member') {
      throw new ForbiddenException(
        'Solo administración o staff puede actualizar cobros.',
      );
    }

    const mp = await this.prisma.membershipPayment.findUnique({
      where: { mp_id: mpId },
    });
    if (!mp) throw new NotFoundException('Registro de cobro no encontrado.');

    if (mp.member_id != null) {
      const member = await this.prisma.gymMember.findUnique({
        where: { id: mp.member_id },
      });
      if (member && normalizeClubRole(member.role_name) === 'member') {
        const settingRow = await this.settingsRow();
        const ownOnly =
          r === 'staff_member' && settingRow?.staff_can_view_own_member === 1;
        if (
          ownOnly &&
          member.assign_staff_mem != null &&
          member.assign_staff_mem !== actor.userId
        ) {
          throw new ForbiddenException(
            'No puedes modificar cobros de socios que no tienes asignados.',
          );
        }
      }
    }

    const total = Number(mp.membership_amount ?? 0);
    await this.prisma.membershipPayment.update({
      where: { mp_id: mpId },
      data: {
        paid_amount: total,
        payment_status: '1',
        membership_status: 'Continue',
      },
    });
    await this.dashboardCache.invalidateBusinessMetrics();
    return { ok: true };
  }
}
