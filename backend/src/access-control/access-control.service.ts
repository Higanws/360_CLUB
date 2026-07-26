import {
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { GymMember } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { normalizeClubRole } from '../shared/domain/club/club-roles';
import {
  buildPageMeta,
  paginationSkip,
  type PaginatedMeta,
} from '../shared/dto/paginated-meta';
import { DashboardCacheService } from '../shared/cache/dashboard-cache.service';
import { normalizeMemberLookupToken } from '../shared/domain/club/member-lookup';
import { toIsoDateOnly } from '../shared/domain/shared/iso-date';
import { todayYmdMadrid } from '../member-wellness/madrid-week.util';

export { normalizeMemberLookupToken } from '../shared/domain/club/member-lookup';

export type AccessCheckResult = {
  valid: boolean;
  status: string;
  message: string;
  member_numeric_id: number | null;
  member_code: string | null;
  di_dni_type: string | null;
  di_dni_number: string | null;
  first_name: string | null;
  last_name: string | null;
  image: string | null;
  cycle_type: string;
  days_remaining: number | null;
  days_overdue: number | null;
  due_date: string | null;
  recorded: boolean;
};

type JwtActor = { userId: number; role_name: string };

type AccessLogPersist = {
  outcome: string;
  status_display: string | null;
  member_id: number | null;
  due_date_snapshot?: string | null;
  days_remaining?: number | null;
  days_overdue?: number | null;
};

function dateOnly(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

@Injectable()
export class AccessControlService {
  private readonly logger = new Logger(AccessControlService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardCache: DashboardCacheService,
  ) {}

  private async settingsRow() {
    return this.prisma.generalSetting.findFirst({ orderBy: { id: 'asc' } });
  }

  private async assertStaffMayViewMember(
    actor: JwtActor,
    member: GymMember,
  ): Promise<void> {
    if (normalizeClubRole(actor.role_name) !== 'staff_member') return;
    if (member.assign_staff_mem !== actor.userId) {
      throw new ForbiddenException(
        'No puedes registrar acceso de socios que no tienes asignados.',
      );
    }
  }

  async findMemberByLookup(lookupRaw: string): Promise<GymMember | null> {
    const q = lookupRaw.trim();
    if (!q) return null;

    if (/^\d+$/.test(q)) {
      const id = parseInt(q, 10);
      const rows = await this.prisma.$queryRaw<GymMember[]>`
        SELECT *
        FROM gym_member m
        WHERE m.id = ${id}
          AND LOWER(TRIM(m.role_name)) = 'member'
        LIMIT 1
      `;
      return rows[0] ?? null;
    }

    const token = normalizeMemberLookupToken(q);
    if (!token) return null;

    const byCode = await this.prisma.$queryRaw<GymMember[]>`
      SELECT *
      FROM gym_member m
      WHERE LOWER(TRIM(m.role_name)) = 'member'
        AND UPPER(REPLACE(TRIM(COALESCE(m.member_id, '')), ' ', '')) = ${token}
      LIMIT 1
    `;
    if (byCode[0]) return byCode[0];

    const byDni = await this.prisma.$queryRaw<GymMember[]>`
      SELECT *
      FROM gym_member m
      WHERE LOWER(TRIM(m.role_name)) = 'member'
        AND UPPER(REPLACE(TRIM(COALESCE(m.di_dni_number, '')), ' ', '')) = ${token}
      LIMIT 1
    `;
    return byDni[0] ?? null;
  }

  private async latestPaymentEnd(memberId: number): Promise<{
    end: string | null;
    start: string | null;
  }> {
    const row = await this.prisma.membershipPayment.findFirst({
      where: {
        member_id: memberId,
        end_date: { not: null },
      },
      orderBy: [{ end_date: 'desc' }, { mp_id: 'desc' }],
    });
    if (!row?.end_date) return { end: null, start: null };
    return {
      end: toIsoDateOnly(row.end_date),
      start: toIsoDateOnly(row.start_date),
    };
  }

  private cycleTypeFromRange(
    start: string | null,
    end: string | null,
  ): string {
    if (!start || !end) return '';
    const a = new Date(start + 'T12:00:00Z').getTime();
    const b = new Date(end + 'T12:00:00Z').getTime();
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return '';
    const days = Math.floor((b - a) / 86400000);
    return days >= 364 ? 'ANUAL' : 'MENSUAL';
  }

  /** Estado de acceso (lógica alineada con PHP `GymAttendanceController::buildMembershipAccessStatus` + `take_attendance.php`). */
  async evaluateMemberAccess(member: GymMember): Promise<{
    valid: boolean;
    status: string;
    message: string;
    due_date: string | null;
    cycle_type: string;
    days_remaining: number | null;
    days_overdue: number | null;
  }> {
    const today = todayYmdMadrid();

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
        due_date: toIsoDateOnly(member.membership_valid_to),
        cycle_type: '',
        days_remaining: null,
        days_overdue: null,
      };
    }

    const pay = await this.latestPaymentEnd(member.id);
    let dueDate = pay.end;
    if (!dueDate) {
      dueDate = toIsoDateOnly(member.membership_valid_to);
    }

    const vf = toIsoDateOnly(member.membership_valid_from);
    const vt = toIsoDateOnly(member.membership_valid_to);
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
      const overdue = Math.floor(
        (Date.parse(today + 'T12:00:00') -
          Date.parse(vt + 'T12:00:00')) /
          86400000,
      );
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

    const diffDays = Math.floor(
      (Date.parse(dueDate + 'T12:00:00') - Date.parse(today + 'T12:00:00')) /
        86400000,
    );

    const cycle_type = this.cycleTypeFromRange(pay.start, pay.end);

    if (diffDays >= 0) {
      return {
        valid: true,
        status: 'PERMITIDO',
        message:
          diffDays === 0
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

  private async alreadyAllowedToday(
    memberId: number,
    accessDate: string,
  ): Promise<boolean> {
    const n = await this.prisma.clubAccessLog.count({
      where: {
        member_id: memberId,
        access_date: dateOnly(accessDate),
        outcome: 'allowed',
      },
    });
    return n > 0;
  }

  async checkAndRecord(
    actor: JwtActor,
    lookupRaw: string,
    record: boolean,
  ): Promise<AccessCheckResult> {
    const accessDate = todayYmdMadrid();
    const trimmed = lookupRaw.trim();

    const baseEmpty = (): AccessCheckResult => ({
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

    const persist = async (partial: AccessLogPersist) => {
      if (!record) return;
      try {
        await this.prisma.clubAccessLog.create({
          data: {
            member_id: partial.member_id,
            access_date: dateOnly(accessDate),
            access_at: new Date(),
            staff_actor_id: actor.userId,
            outcome: partial.outcome,
            status_display: partial.status_display,
            lookup_raw: trimmed.slice(0, 160),
            due_date_snapshot: partial.due_date_snapshot
              ? dateOnly(partial.due_date_snapshot)
              : null,
            days_remaining: partial.days_remaining ?? null,
            days_overdue: partial.days_overdue ?? null,
          },
        });
        await this.dashboardCache.invalidateBusinessMetrics();
      } catch (e) {
        this.logger.warn(
          `No se pudo guardar club_access_log: ${e instanceof Error ? e.message : e}`,
        );
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
    } catch (e) {
      if (e instanceof ForbiddenException) {
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

    const normR = normalizeClubRole(member.role_name);
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
        outcome:
          ev.status === 'NO_ACTIVO'
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

  private isYmd(s: string | null | undefined): s is string {
    return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  }

  async recentLogs(
    actor: JwtActor,
    page = 1,
    pageSize = 25,
    fromYmd?: string | null,
    toYmd?: string | null,
  ): Promise<{
    logs: Array<{
      id: number;
      access_at: string;
      access_date: string;
      outcome: string;
      status_display: string | null;
      lookup_raw: string | null;
      member_id: number | null;
      first_name: string | null;
      last_name: string | null;
      staff_first_name: string | null;
      staff_last_name: string | null;
    }>;
    meta: PaginatedMeta;
  }> {
    const ps = Math.min(100, Math.max(1, pageSize));
    const pg = Math.max(1, page);
    const settings = await this.settingsRow();
    const ownOnly = settings?.staff_can_view_own_member === 1;

    let from = this.isYmd(fromYmd) ? fromYmd : null;
    let to = this.isYmd(toYmd) ? toYmd : null;
    if (from && to && from > to) {
      const t = from;
      from = to;
      to = t;
    }

    const conditions: Prisma.Sql[] = [];
    if (from) {
      conditions.push(Prisma.sql`l.access_date >= ${from}`);
    }
    if (to) {
      conditions.push(Prisma.sql`l.access_date <= ${to}`);
    }
    if (
      normalizeClubRole(actor.role_name) === 'staff_member' &&
      ownOnly
    ) {
      conditions.push(
        Prisma.sql`(m.assign_staff_mem = ${actor.userId} OR l.staff_actor_id = ${actor.userId})`,
      );
    }
    const whereSql =
      conditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
        : Prisma.empty;

    const totalRows = await this.prisma.$queryRaw<
      Array<{ cnt: bigint | number }>
    >`
      SELECT COUNT(*) AS cnt
      FROM club_access_log l
      LEFT JOIN gym_member m ON m.id = l.member_id
      LEFT JOIN gym_member s ON s.id = l.staff_actor_id
      ${whereSql}
    `;
    const total = Number(totalRows[0]?.cnt ?? 0);

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: number | bigint;
        access_at: Date | string;
        access_date: Date | string;
        outcome: string;
        status_display: string | null;
        lookup_raw: string | null;
        member_id: number | bigint | null;
        first_name: string | null;
        last_name: string | null;
        staff_first_name: string | null;
        staff_last_name: string | null;
      }>
    >`
      SELECT
        l.id AS id,
        l.access_at AS access_at,
        l.access_date AS access_date,
        l.outcome AS outcome,
        l.status_display AS status_display,
        l.lookup_raw AS lookup_raw,
        l.member_id AS member_id,
        m.first_name AS first_name,
        m.last_name AS last_name,
        s.first_name AS staff_first_name,
        s.last_name AS staff_last_name
      FROM club_access_log l
      LEFT JOIN gym_member m ON m.id = l.member_id
      LEFT JOIN gym_member s ON s.id = l.staff_actor_id
      ${whereSql}
      ORDER BY l.id DESC
      LIMIT ${ps} OFFSET ${paginationSkip(pg, ps)}
    `;

    return {
      logs: rows.map((r) => ({
        id: Number(r.id),
        access_at:
          r.access_at instanceof Date
            ? r.access_at.toISOString()
            : String(r.access_at),
        access_date: toIsoDateOnly(r.access_date) ?? String(r.access_date),
        outcome: r.outcome,
        status_display: r.status_display,
        lookup_raw: r.lookup_raw,
        member_id: r.member_id == null ? null : Number(r.member_id),
        first_name: r.first_name,
        last_name: r.last_name,
        staff_first_name: r.staff_first_name,
        staff_last_name: r.staff_last_name,
      })),
      meta: buildPageMeta(total, pg, ps),
    };
  }
}
