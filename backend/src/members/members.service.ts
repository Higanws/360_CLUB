/**
 * Caso de uso de socios: solo DML vía Prisma. Las tablas siguen el modelo MySQL real;
 * Esquema MVP: `backend/database/schema/schema_mysql.sql`; seed demo en `database/seed/seed_mvp.sql`.
 */
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { GymMember } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { normalizeClubRole } from '../shared/domain/club/club-roles';
import {
  assertStaffOwnsMember,
  staffMustUseOwnMembersOnly,
} from '../shared/application/security/staff-member-scope';
import { toIsoDateOnly } from '../shared/domain/shared/iso-date';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../shared/application/ports/password-hasher.port';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

export type MembersListRow = {
  id: number;
  activated: number | null;
  member_id: string | null;
  first_name: string | null;
  last_name: string | null;
  image: string | null;
  membership_status: string | null;
  membership_valid_from: string | null;
  membership_valid_to: string | null;
};

export type MembersListResponse = {
  title: string;
  subtitle: string;
  members: MembersListRow[];
  meta: {
    role_name: string;
    can_add_member: boolean;
    show_status_column: boolean;
    date_format: string | null;
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
};

export type SafeMemberDetail = {
  id: number;
  activated: number | null;
  member_id: string | null;
  di_dni_type: string | null;
  di_dni_number: string | null;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  birth_date: string | null;
  email: string | null;
  username: string | null;
  mobile: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  image: string | null;
  assign_staff_mem: number | null;
  selected_membership: string | null;
  membership_status: string | null;
  membership_valid_from: string | null;
  membership_valid_to: string | null;
  inquiry_date: string | null;
  trial_end_date: string | null;
  first_pay_date: string | null;
  created_date: string | null;
  subscribe_nutrition_general: boolean;
  subscribe_training_general: boolean;
  physical_weight_kg: number | null;
  physical_height_cm: number | null;
  physical_chest_cm: number | null;
  physical_waist_cm: number | null;
  physical_thigh_cm: number | null;
  physical_arms_cm: number | null;
  physical_fat_percent: number | null;
};

function numFromDecColumn(
  s: Prisma.Decimal | string | number | null | undefined,
): number | null {
  if (s == null || s === '') return null;
  const n = typeof s === 'number' ? s : parseFloat(s.toString());
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function parseDecimalDto(v: unknown): string | null {
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (!Number.isFinite(n)) return null;
  return n.toFixed(2);
}

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  private async settingsRow() {
    return this.prisma.generalSetting.findFirst({ orderBy: { id: 'asc' } });
  }

  private assertBusinessRole(role_name: string): void {
    const r = normalizeClubRole(role_name);
    if (r !== 'administrator' && r !== 'staff_member') {
      throw new ForbiddenException(
        'El módulo de socios es solo para administración o staff del club.',
      );
    }
  }

  private memberTypeToStatus(
    t: string | undefined,
  ): 'Continue' | 'Not Available' | 'Expired' {
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

  private formatMemberCode(id: number): string {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `M${id}${dd}${yy}`;
  }

  private parseOptionalDate(s?: string | null): Date | null {
    if (s == null || s === '') return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  async assertCanManageMember(
    actor: { userId: number; role_name: string },
    member: GymMember,
  ): Promise<void> {
    this.assertBusinessRole(actor.role_name);
    assertStaffOwnsMember(actor, member);
  }

  private async assertUsernameAvailable(
    username: string,
    excludeId?: number,
  ): Promise<void> {
    const u = username.trim();
    const rows = await this.prisma.$queryRaw<Array<{ n: bigint | number }>>`
      SELECT COUNT(*) AS n FROM gym_member
      WHERE LOWER(TRIM(username)) = LOWER(TRIM(${u}))
        ${excludeId != null ? Prisma.sql`AND id != ${excludeId}` : Prisma.empty}
    `;
    const n = Number(rows[0]?.n ?? 0);
    if (n > 0) {
      throw new ConflictException('Ya existe un usuario con ese nombre de acceso.');
    }
  }

  private async assertDniAvailable(
    type: string,
    number: string,
    excludeId?: number,
  ): Promise<void> {
    const t = type.trim().toUpperCase();
    const n = number.trim().toUpperCase().replace(/\s+/g, '');
    const rows = await this.prisma.$queryRaw<Array<{ c: bigint | number }>>`
      SELECT COUNT(*) AS c FROM gym_member
      WHERE LOWER(TRIM(role_name)) = 'member'
        AND UPPER(TRIM(di_dni_type)) = ${t}
        AND UPPER(TRIM(di_dni_number)) = ${n}
        ${excludeId != null ? Prisma.sql`AND id != ${excludeId}` : Prisma.empty}
    `;
    const c = Number(rows[0]?.c ?? 0);
    if (c > 0) {
      throw new ConflictException('Ya existe un socio con ese documento.');
    }
  }

  private toSafeDetail(m: GymMember): SafeMemberDetail {
    return {
      id: m.id,
      activated: m.activated,
      member_id: m.member_id,
      di_dni_type: m.di_dni_type,
      di_dni_number: m.di_dni_number,
      first_name: m.first_name,
      last_name: m.last_name,
      gender: m.gender,
      birth_date: toIsoDateOnly(m.birth_date),
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
      membership_valid_from: toIsoDateOnly(m.membership_valid_from),
      membership_valid_to: toIsoDateOnly(m.membership_valid_to),
      inquiry_date: toIsoDateOnly(m.inquiry_date),
      trial_end_date: toIsoDateOnly(m.trial_end_date),
      first_pay_date: toIsoDateOnly(m.first_pay_date),
      created_date: toIsoDateOnly(m.created_date),
      subscribe_nutrition_general: (m.subscribe_nutrition_general ?? 1) === 1,
      subscribe_training_general: (m.subscribe_training_general ?? 1) === 1,
      physical_weight_kg: numFromDecColumn(m.physical_weight_kg),
      physical_height_cm: numFromDecColumn(m.physical_height_cm),
      physical_chest_cm: numFromDecColumn(m.physical_chest_cm),
      physical_waist_cm: numFromDecColumn(m.physical_waist_cm),
      physical_thigh_cm: numFromDecColumn(m.physical_thigh_cm),
      physical_arms_cm: numFromDecColumn(m.physical_arms_cm),
      physical_fat_percent: numFromDecColumn(m.physical_fat_percent),
    };
  }

  async searchForUser(payload: {
    userId: number;
    role_name: string;
    q: string;
    limit: number;
  }): Promise<{ members: MembersListRow[]; total: number }> {
    const role = normalizeClubRole(payload.role_name);
    if (role === 'member') {
      throw new ForbiddenException(
        'Los socios no tienen acceso al módulo de gestión. Contacta con recepción.',
      );
    }
    this.assertBusinessRole(payload.role_name);

    const q = payload.q.trim();
    if (!q) {
      return { members: [], total: 0 };
    }

    const limit = Math.min(50, Math.max(1, Math.floor(payload.limit) || 20));
    const uid = payload.userId;

    const where: Prisma.GymMemberWhereInput = {
      role_name: 'member',
      OR: [
        { first_name: { contains: q } },
        { last_name: { contains: q } },
        { username: { contains: q } },
        { di_dni_number: { contains: q } },
        { member_id: { contains: q } },
      ],
      ...(role === 'staff_member' ? { assign_staff_mem: uid } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.gymMember.count({ where }),
      this.prisma.gymMember.findMany({
        where,
        select: {
          id: true,
          activated: true,
          member_id: true,
          first_name: true,
          last_name: true,
          image: true,
          username: true,
          di_dni_number: true,
          membership_status: true,
          membership_valid_from: true,
          membership_valid_to: true,
        },
        orderBy: [{ first_name: 'asc' }, { last_name: 'asc' }],
        take: limit,
      }),
    ]);

    const members: MembersListRow[] = rows.map((r) => ({
      id: r.id,
      activated: r.activated,
      member_id: r.member_id,
      first_name: r.first_name,
      last_name: r.last_name,
      image: r.image,
      membership_status: r.membership_status,
      membership_valid_from: toIsoDateOnly(r.membership_valid_from),
      membership_valid_to: toIsoDateOnly(r.membership_valid_to),
    }));

    return { members, total };
  }

  async listForUser(payload: {
    userId: number;
    role_name: string;
    page: number;
    pageSize: number;
    q?: string;
  }): Promise<MembersListResponse> {
    const role = normalizeClubRole(payload.role_name);
    if (role === 'member') {
      throw new ForbiddenException(
        'Los socios no tienen acceso al módulo de gestión. Contacta con recepción.',
      );
    }
    this.assertBusinessRole(payload.role_name);

    const uid = payload.userId;
    const settingRow = await this.settingsRow();
    const page = Math.max(1, Math.floor(payload.page) || 1);
    const pageSize = Math.min(
      500,
      Math.max(1, Math.floor(payload.pageSize) || 25),
    );

    const qTrim = payload.q?.trim();
    const where: Prisma.GymMemberWhereInput = {
      role_name: 'member',
      ...(role === 'staff_member' ? { assign_staff_mem: uid } : {}),
      ...(qTrim
        ? {
            OR: [
              { first_name: { contains: qTrim } },
              { last_name: { contains: qTrim } },
              { username: { contains: qTrim } },
              { di_dni_number: { contains: qTrim } },
              { member_id: { contains: qTrim } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.gymMember.count({ where }),
      this.prisma.gymMember.findMany({
        where,
        select: {
          id: true,
          activated: true,
          member_id: true,
          first_name: true,
          last_name: true,
          image: true,
          membership_status: true,
          membership_valid_from: true,
          membership_valid_to: true,
          assign_staff_mem: true,
        },
        orderBy: [{ first_name: 'asc' }, { last_name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const mapped: MembersListRow[] = rows.map((r) => ({
      id: r.id,
      activated: r.activated,
      member_id: r.member_id,
      first_name: r.first_name,
      last_name: r.last_name,
      image: r.image,
      membership_status: r.membership_status,
      membership_valid_from: toIsoDateOnly(r.membership_valid_from),
      membership_valid_to: toIsoDateOnly(r.membership_valid_to),
    }));

    const pageCount = total === 0 ? 1 : Math.ceil(total / pageSize);

    return {
      title: 'Lista de socios',
      subtitle: 'Socios',
      members: mapped,
      meta: {
        role_name: payload.role_name,
        can_add_member: role === 'administrator',
        show_status_column: role === 'administrator',
        date_format: settingRow?.date_format ?? null,
        page,
        pageSize,
        total,
        pageCount,
      },
    };
  }

  async formOptions() {
    const staffRows = await this.prisma.gymMember.findMany({
      where: { role_name: 'staff_member' },
      select: { id: true, first_name: true, last_name: true },
      orderBy: { first_name: 'asc' },
    });

    const plans = await this.prisma.membership.findMany({
      orderBy: { membership_label: 'asc' },
    });

    return {
      staff: staffRows.map((s) => ({
        id: s.id,
        label: [s.first_name, s.last_name].filter(Boolean).join(' ').trim(),
      })),
      memberships: plans.map((p) => ({
        id: p.id,
        membership_label: p.membership_label,
        amount: p.membership_amount,
      })),
    };
  }

  async findOne(
    id: number,
    actor: { userId: number; role_name: string },
  ): Promise<{ member: SafeMemberDetail }> {
    this.assertBusinessRole(actor.role_name);
    const m = await this.prisma.gymMember.findUnique({ where: { id } });
    if (!m || normalizeClubRole(m.role_name) !== 'member') {
      throw new NotFoundException('Socio no encontrado.');
    }
    await this.assertCanManageMember(actor, m);
    return { member: this.toSafeDetail(m) };
  }

  async create(
    dto: CreateMemberDto,
    actor: { userId: number; role_name: string },
  ): Promise<{ member: SafeMemberDetail }> {
    if (staffMustUseOwnMembersOnly(actor)) {
      throw new ForbiddenException(
        'Solo el administrador puede dar de alta socios.',
      );
    }
    this.assertBusinessRole(actor.role_name);

    await this.assertUsernameAvailable(dto.username);
    await this.assertDniAvailable(dto.di_dni_type, dto.di_dni_number);

    const membership_status = this.memberTypeToStatus('Member');
    const hash = await this.passwordHasher.hash(dto.password);

    const saved = await this.prisma.gymMember.create({
      data: {
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
        di_dni_number: dto.di_dni_number
          .trim()
          .toUpperCase()
          .replace(/\s+/g, ''),
        member_type: 'Member',
        membership_status,
        membership_valid_from: this.parseOptionalDate(
          dto.membership_valid_from,
        ),
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
        subscribe_nutrition_general: dto.subscribe_nutrition_general === false ? 0 : 1,
        subscribe_training_general: dto.subscribe_training_general === false ? 0 : 1,
      },
    });

    const member_id = this.formatMemberCode(saved.id);
    await this.prisma.gymMember.update({
      where: { id: saved.id },
      data: { member_id },
    });

    await this.insertMembershipPaymentIfNeeded(
      saved.id,
      dto.selected_membership,
      membership_status,
      dto.membership_valid_from,
      dto.membership_valid_to,
      actor.userId,
    );

    const fresh = await this.prisma.gymMember.findUnique({
      where: { id: saved.id },
    });
    if (!fresh) throw new NotFoundException();
    return { member: this.toSafeDetail(fresh) };
  }

  private async insertMembershipPaymentIfNeeded(
    memberId: number,
    selectedMembership: string | null | undefined,
    membership_status: string,
    start: string | undefined,
    end: string | undefined,
    createdBy: number,
  ): Promise<void> {
    if (!selectedMembership?.trim()) return;
    const mid = parseInt(selectedMembership.trim(), 10);
    if (Number.isNaN(mid) || mid < 1) return;

    const plan = await this.prisma.membership.findUnique({
      where: { id: mid },
    });
    if (!plan) return;

    await this.prisma.membershipPayment.create({
      data: {
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
      },
    });
  }

  async update(
    id: number,
    dto: UpdateMemberDto,
    actor: { userId: number; role_name: string },
  ): Promise<{ member: SafeMemberDetail }> {
    this.assertBusinessRole(actor.role_name);
    const m = await this.prisma.gymMember.findUnique({ where: { id } });
    if (!m || normalizeClubRole(m.role_name) !== 'member') {
      throw new NotFoundException('Socio no encontrado.');
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

    const data: Prisma.GymMemberUpdateInput = {};

    if (dto.password !== undefined && dto.password.length > 0) {
      data.password = await this.passwordHasher.hash(dto.password);
    }

    if (dto.first_name !== undefined) data.first_name = dto.first_name.trim();
    if (dto.last_name !== undefined) data.last_name = dto.last_name.trim();
    if (dto.username !== undefined) data.username = dto.username.trim();
    if (dto.email !== undefined) data.email = dto.email?.trim() || null;
    if (dto.mobile !== undefined) data.mobile = dto.mobile?.trim() || null;
    if (dto.phone !== undefined) data.phone = dto.phone?.trim() || null;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.birth_date !== undefined)
      data.birth_date = this.parseOptionalDate(dto.birth_date);
    if (dto.address !== undefined) data.address = dto.address?.trim() || null;
    if (dto.city !== undefined) data.city = dto.city?.trim() || null;
    if (dto.state !== undefined) data.state = dto.state?.trim() || null;
    if (dto.zipcode !== undefined) data.zipcode = dto.zipcode?.trim() || null;
    if (dto.di_dni_type !== undefined)
      data.di_dni_type = dto.di_dni_type.trim().toUpperCase();
    if (dto.di_dni_number !== undefined)
      data.di_dni_number = dto.di_dni_number
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '');
    if (dto.membership_valid_from !== undefined)
      data.membership_valid_from = this.parseOptionalDate(
        dto.membership_valid_from,
      );
    if (dto.membership_valid_to !== undefined)
      data.membership_valid_to = this.parseOptionalDate(
        dto.membership_valid_to,
      );
    if (dto.selected_membership !== undefined)
      data.selected_membership = dto.selected_membership?.trim() || null;
    if (dto.assign_staff_mem !== undefined)
      data.assign_staff_mem = dto.assign_staff_mem ?? null;
    if (dto.activated !== undefined) data.activated = dto.activated;
    if (dto.physical_weight_kg !== undefined)
      data.physical_weight_kg = parseDecimalDto(dto.physical_weight_kg);
    if (dto.physical_height_cm !== undefined)
      data.physical_height_cm = parseDecimalDto(dto.physical_height_cm);
    if (dto.physical_chest_cm !== undefined)
      data.physical_chest_cm = parseDecimalDto(dto.physical_chest_cm);
    if (dto.physical_waist_cm !== undefined)
      data.physical_waist_cm = parseDecimalDto(dto.physical_waist_cm);
    if (dto.physical_thigh_cm !== undefined)
      data.physical_thigh_cm = parseDecimalDto(dto.physical_thigh_cm);
    if (dto.physical_arms_cm !== undefined)
      data.physical_arms_cm = parseDecimalDto(dto.physical_arms_cm);
    if (dto.physical_fat_percent !== undefined)
      data.physical_fat_percent = parseDecimalDto(dto.physical_fat_percent);
    if (dto.subscribe_nutrition_general !== undefined)
      data.subscribe_nutrition_general = dto.subscribe_nutrition_general ? 1 : 0;
    if (dto.subscribe_training_general !== undefined)
      data.subscribe_training_general = dto.subscribe_training_general ? 1 : 0;

    await this.prisma.gymMember.update({ where: { id }, data });

    const fresh = await this.prisma.gymMember.findUnique({ where: { id } });
    if (!fresh) throw new NotFoundException();
    return { member: this.toSafeDetail(fresh) };
  }

  async remove(
    id: number,
    actor: { userId: number; role_name: string },
  ): Promise<{ ok: true }> {
    this.assertBusinessRole(actor.role_name);
    const m = await this.prisma.gymMember.findUnique({ where: { id } });
    if (!m || normalizeClubRole(m.role_name) !== 'member') {
      throw new NotFoundException('Socio no encontrado.');
    }
    await this.assertCanManageMember(actor, m);

    await this.prisma.membershipPayment.deleteMany({
      where: { member_id: id },
    });
    await this.prisma.gymMember.delete({ where: { id } });
    return { ok: true };
  }
}
