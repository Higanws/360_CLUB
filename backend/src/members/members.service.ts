/**
 * Caso de uso de socios: solo DML vía TypeORM. Las tablas siguen el modelo MySQL real;
 * DDL opcional del asistente: `database/schema/schema_mysql.sql` (MVP).
 */
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { ClassSchedule } from '../entities/class-schedule.entity';
import { GeneralSetting } from '../entities/general-setting.entity';
import { GymMemberClass } from '../entities/gym-member-class.entity';
import { GymMember } from '../entities/gym-member.entity';
import { MembershipPayment } from '../entities/membership-payment.entity';
import { Membership } from '../entities/membership.entity';
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
  assign_class_ids: number[];
  physical_weight_kg: number | null;
  physical_height_cm: number | null;
  physical_chest_cm: number | null;
  physical_waist_cm: number | null;
  physical_thigh_cm: number | null;
  physical_arms_cm: number | null;
  physical_fat_percent: number | null;
};

function isoDateOnly(v: Date | string | null | undefined): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function numFromDecColumn(s: string | null | undefined): number | null {
  if (s == null || s === '') return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function parseDecimalDto(v: unknown): string | null {
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (!Number.isFinite(n)) return null;
  return n.toFixed(2);
}

function normRole(r: string | null | undefined): string {
  return (r ?? '').trim().toLowerCase();
}

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(GymMember)
    private readonly members: Repository<GymMember>,
    @InjectRepository(GeneralSetting)
    private readonly settings: Repository<GeneralSetting>,
    @InjectRepository(GymMemberClass)
    private readonly memberClass: Repository<GymMemberClass>,
    @InjectRepository(Membership)
    private readonly membership: Repository<Membership>,
    @InjectRepository(MembershipPayment)
    private readonly membershipPayment: Repository<MembershipPayment>,
    @InjectRepository(ClassSchedule)
    private readonly classSchedule: Repository<ClassSchedule>,
  ) {}

  private async settingsRow(): Promise<GeneralSetting | null> {
    return (
      (await this.settings.find({ take: 1, order: { id: 'ASC' } }))[0] ?? null
    );
  }

  private assertBusinessRole(role_name: string): void {
    const r = normRole(role_name);
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
    const r = normRole(actor.role_name);
    if (r === 'administrator') return;

    const s = await this.settingsRow();
    const ownOnly = s?.staff_can_view_own_member === 1;
    if (ownOnly) {
      if (member.assign_staff_mem !== actor.userId) {
        throw new ForbiddenException(
          'No puedes gestionar socios que no tienes asignados.',
        );
      }
    }
  }

  private async assertUsernameAvailable(
    username: string,
    excludeId?: number,
  ): Promise<void> {
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
      throw new ConflictException('Ya existe un socio con ese documento.');
    }
  }

  private toSafeDetail(
    m: GymMember,
    assign_class_ids: number[],
  ): SafeMemberDetail {
    return {
      id: m.id,
      activated: m.activated,
      member_id: m.member_id,
      di_dni_type: m.di_dni_type,
      di_dni_number: m.di_dni_number,
      first_name: m.first_name,
      last_name: m.last_name,
      gender: m.gender,
      birth_date: isoDateOnly(m.birth_date as Date),
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
      membership_valid_from: isoDateOnly(m.membership_valid_from as Date),
      membership_valid_to: isoDateOnly(m.membership_valid_to as Date),
      inquiry_date: isoDateOnly(m.inquiry_date as Date),
      trial_end_date: isoDateOnly(m.trial_end_date as Date),
      first_pay_date: isoDateOnly(m.first_pay_date as Date),
      created_date: isoDateOnly(m.created_date as Date),
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

  async listForUser(payload: {
    userId: number;
    role_name: string;
  }): Promise<MembersListResponse> {
    const role = normRole(payload.role_name);
    if (role === 'member') {
      throw new ForbiddenException(
        'Los socios no tienen acceso al módulo de gestión. Contacta con recepción.',
      );
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
      /* todos */
    } else if (role === 'staff_member') {
      const ownOnly = settingRow?.staff_can_view_own_member === 1;
      if (ownOnly) {
        qb.andWhere('m.assign_staff_mem = :uid', { uid });
      }
    }

    const rows = await qb
      .orderBy('m.first_name', 'ASC')
      .addOrderBy('m.last_name', 'ASC')
      .getMany();

    const mapped: MembersListRow[] = rows.map((r) => ({
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

  async findOne(
    id: number,
    actor: { userId: number; role_name: string },
  ): Promise<{ member: SafeMemberDetail }> {
    this.assertBusinessRole(actor.role_name);
    const m = await this.members.findOne({ where: { id } });
    if (!m || normRole(m.role_name) !== 'member') {
      throw new NotFoundException('Socio no encontrado.');
    }
    await this.assertCanManageMember(actor, m);
    const cls = await this.memberClass.find({
      where: { member_id: id },
      order: { id: 'ASC' },
    });
    const ids = cls
      .map((c) => c.assign_class)
      .filter((x): x is number => x != null);
    return { member: this.toSafeDetail(m, ids) };
  }

  async create(
    dto: CreateMemberDto,
    actor: { userId: number; role_name: string },
  ): Promise<{ member: SafeMemberDetail }> {
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
    await this.insertMembershipPaymentIfNeeded(
      saved.id,
      dto.selected_membership,
      membership_status,
      dto.membership_valid_from,
      dto.membership_valid_to,
      actor.userId,
    );

    const fresh = await this.members.findOne({ where: { id: saved.id } });
    if (!fresh) throw new NotFoundException();
    const cls = await this.memberClass.find({ where: { member_id: saved.id } });
    const ids = cls
      .map((c) => c.assign_class)
      .filter((x): x is number => x != null);
    return { member: this.toSafeDetail(fresh, ids) };
  }

  private async replaceClassAssignments(
    memberId: number,
    classIds: number[],
  ): Promise<void> {
    await this.memberClass.delete({ member_id: memberId });
    const uniq = [...new Set(classIds)].filter((id) => id > 0);
    for (const assign_class of uniq) {
      await this.memberClass.save(
        this.memberClass.create({ member_id: memberId, assign_class }),
      );
    }
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

    const plan = await this.membership.findOne({ where: { id: mid } });
    if (!plan) return;

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

  async update(
    id: number,
    dto: UpdateMemberDto,
    actor: { userId: number; role_name: string },
  ): Promise<{ member: SafeMemberDetail }> {
    this.assertBusinessRole(actor.role_name);
    const m = await this.members.findOne({ where: { id } });
    if (!m || normRole(m.role_name) !== 'member') {
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

    if (dto.password !== undefined && dto.password.length > 0) {
      m.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.first_name !== undefined) m.first_name = dto.first_name.trim();
    if (dto.last_name !== undefined) m.last_name = dto.last_name.trim();
    if (dto.username !== undefined) m.username = dto.username.trim();
    if (dto.email !== undefined) m.email = dto.email?.trim() || null;
    if (dto.mobile !== undefined) m.mobile = dto.mobile?.trim() || null;
    if (dto.phone !== undefined) m.phone = dto.phone?.trim() || null;
    if (dto.gender !== undefined) m.gender = dto.gender;
    if (dto.birth_date !== undefined)
      m.birth_date = this.parseOptionalDate(dto.birth_date);
    if (dto.address !== undefined) m.address = dto.address?.trim() || null;
    if (dto.city !== undefined) m.city = dto.city?.trim() || null;
    if (dto.state !== undefined) m.state = dto.state?.trim() || null;
    if (dto.zipcode !== undefined) m.zipcode = dto.zipcode?.trim() || null;
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
    if (dto.activated !== undefined) m.activated = dto.activated;
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
    if (!fresh) throw new NotFoundException();
    const cls = await this.memberClass.find({ where: { member_id: id } });
    const ids = cls
      .map((c) => c.assign_class)
      .filter((x): x is number => x != null);
    return { member: this.toSafeDetail(fresh, ids) };
  }

  async remove(
    id: number,
    actor: { userId: number; role_name: string },
  ): Promise<{ ok: true }> {
    this.assertBusinessRole(actor.role_name);
    const m = await this.members.findOne({ where: { id } });
    if (!m || normRole(m.role_name) !== 'member') {
      throw new NotFoundException('Socio no encontrado.');
    }
    await this.assertCanManageMember(actor, m);

    await this.memberClass.delete({ member_id: id });
    await this.membershipPayment.delete({ member_id: id });
    await this.members.delete({ id });
    return { ok: true };
  }
}
