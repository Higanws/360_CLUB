/**
 * Personal del club (role_name = staff_member). Misma tabla gym_member que socios.
 */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
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
import { toIsoDateOnly } from '../shared/domain/shared/iso-date';
import {
  decodeSpecializationIds,
  encodeSpecializationIds,
} from '../shared/application/security/staff-specialization';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../shared/application/ports/password-hasher.port';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

export type StaffListRow = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  image: string | null;
  email: string | null;
  mobile: string | null;
  club_role_name: string | null;
};

export type StaffDetail = {
  id: number;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  gender: string | null;
  birth_date: string | null;
  role: number | null;
  club_role_name: string | null;
  specialization_ids: number[];
  specialization_labels: string[];
  address: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  mobile: string | null;
  phone: string | null;
  email: string | null;
  username: string | null;
  image: string | null;
  activated: number | null;
};

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  encodeSpecialization(ids: number[]): string {
    return encodeSpecializationIds(ids);
  }

  decodeSpecialization(json: string | null): number[] {
    return decodeSpecializationIds(json);
  }

  async formOptions() {
    const roles = await this.prisma.gymRole.findMany({
      orderBy: { name: 'asc' },
    });
    const specs = await this.prisma.specialization.findMany({
      orderBy: { name: 'asc' },
    });
    return {
      club_roles: roles.map((r) => ({ id: r.id, name: r.name })),
      specializations: specs.map((s) => ({ id: s.id, name: s.name })),
    };
  }

  async listForUser(
    actor: { userId: number; role_name: string },
    page = 1,
    pageSize = 25,
    q?: string,
  ): Promise<{
    staff: StaffListRow[];
    meta: {
      can_manage: boolean;
      is_administrator: boolean;
      page: number;
      pageSize: number;
      total: number;
      pageCount: number;
    };
  }> {
    const ar = normalizeClubRole(actor.role_name);
    if (ar !== 'administrator' && ar !== 'staff_member') {
      throw new ForbiddenException('Sin acceso al listado de personal.');
    }

    const ps = Math.min(100, Math.max(1, pageSize));
    const pg = Math.max(1, page);

    const qTrim = q?.trim();
    const where: Prisma.GymMemberWhereInput = {
      role_name: 'staff_member',
      ...(ar === 'staff_member' ? { id: actor.userId } : {}),
      ...(qTrim
        ? {
            OR: [
              { first_name: { contains: qTrim } },
              { last_name: { contains: qTrim } },
              { email: { contains: qTrim } },
            ],
          }
        : {}),
    };

    const total = await this.prisma.gymMember.count({ where });
    const entities = await this.prisma.gymMember.findMany({
      where,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        image: true,
        email: true,
        mobile: true,
        role: true,
      },
      orderBy: [{ first_name: 'asc' }, { last_name: 'asc' }],
      skip: paginationSkip(pg, ps),
      take: ps,
    });

    const roleIds = [
      ...new Set(
        entities.map((m) => m.role).filter((x): x is number => x != null),
      ),
    ];
    const roleRows =
      roleIds.length > 0
        ? await this.prisma.gymRole.findMany({ where: { id: { in: roleIds } } })
        : [];
    const roleNames = new Map<number, string | null>(
      roleRows.map((r) => [r.id, r.name]),
    );

    const staff: StaffListRow[] = entities.map((m) => ({
      id: m.id,
      first_name: m.first_name,
      last_name: m.last_name,
      image: m.image,
      email: m.email,
      mobile: m.mobile,
      club_role_name:
        m.role != null ? roleNames.get(m.role) ?? null : null,
    }));

    const pageMeta = buildPageMeta(total, pg, ps);
    return {
      staff,
      meta: {
        can_manage: ar === 'administrator',
        is_administrator: ar === 'administrator',
        ...pageMeta,
      },
    };
  }

  private async assertCanViewStaff(
    actor: { userId: number; role_name: string },
    staffId: number,
  ): Promise<void> {
    const ar = normalizeClubRole(actor.role_name);
    if (ar === 'administrator') return;
    if (ar === 'staff_member' && actor.userId === staffId) return;
    throw new ForbiddenException('No puedes ver la ficha de otro usuario.');
  }

  async findOne(
    id: number,
    actor: { userId: number; role_name: string },
  ): Promise<{ staff: StaffDetail }> {
    await this.assertCanViewStaff(actor, id);

    const m = await this.prisma.gymMember.findUnique({ where: { id } });
    if (!m || normalizeClubRole(m.role_name) !== 'staff_member') {
      throw new NotFoundException('Miembro del personal no encontrado.');
    }

    let club_role_name: string | null = null;
    if (m.role != null) {
      const gr = await this.prisma.gymRole.findUnique({
        where: { id: m.role },
      });
      club_role_name = gr?.name ?? null;
    }

    const specialization_ids = this.decodeSpecialization(m.s_specialization);
    let specialization_labels: string[] = [];
    if (specialization_ids.length) {
      const specs = await this.prisma.specialization.findMany({
        where: { id: { in: specialization_ids } },
      });
      const map = new Map(specs.map((s) => [s.id, s.name ?? '']));
      specialization_labels = specialization_ids
        .map((i) => map.get(i))
        .filter((x): x is string => x != null);
    }

    return {
      staff: {
        id: m.id,
        first_name: m.first_name,
        middle_name: m.middle_name,
        last_name: m.last_name,
        gender: m.gender,
        birth_date: toIsoDateOnly(m.birth_date),
        role: m.role,
        club_role_name,
        specialization_ids,
        specialization_labels,
        address: m.address,
        city: m.city,
        state: m.state,
        zipcode: m.zipcode,
        mobile: m.mobile,
        phone: m.phone,
        email: m.email,
        username: m.username,
        image: m.image,
        activated: m.activated,
      },
    };
  }

  async create(dto: CreateStaffDto): Promise<{ staff: StaffDetail }> {
    await this.assertUsernameAvailable(dto.username);

    const roleRow = await this.prisma.gymRole.findUnique({
      where: { id: dto.role },
    });
    if (!roleRow) {
      throw new BadRequestException('El rol de club indicado no existe.');
    }

    for (const sid of dto.specialization_ids) {
      const ex = await this.prisma.specialization.findUnique({
        where: { id: sid },
      });
      if (!ex) {
        throw new BadRequestException(`Especialización inválida: ${sid}`);
      }
    }

    const hash = await this.passwordHasher.hash(dto.password);
    const saved = await this.prisma.gymMember.create({
      data: {
        role_name: 'staff_member',
        activated: 1,
        first_name: dto.first_name.trim(),
        middle_name: dto.middle_name?.trim() || null,
        last_name: dto.last_name.trim(),
        gender: dto.gender,
        birth_date: new Date(dto.birth_date),
        role: dto.role,
        s_specialization: this.encodeSpecialization(dto.specialization_ids),
        address: dto.address.trim(),
        city: dto.city.trim(),
        state: dto.state?.trim() || null,
        zipcode: dto.zipcode?.trim() || null,
        mobile: dto.mobile.trim(),
        phone: dto.phone?.trim() || null,
        email: dto.email.trim(),
        username: dto.username.trim(),
        password: hash,
        image: 'Thumbnail-img.png',
        member_id: '',
        created_date: new Date(),
      },
    });

    return this.findOne(saved.id, {
      userId: saved.id,
      role_name: 'staff_member',
    });
  }

  async update(
    id: number,
    dto: UpdateStaffDto,
    actor: { userId: number; role_name: string },
  ): Promise<{ staff: StaffDetail }> {
    const m = await this.prisma.gymMember.findUnique({ where: { id } });
    if (!m || normalizeClubRole(m.role_name) !== 'staff_member') {
      throw new NotFoundException('Miembro del personal no encontrado.');
    }

    const data: Prisma.GymMemberUpdateInput = {};

    if (dto.role !== undefined) {
      const roleRow = await this.prisma.gymRole.findUnique({
        where: { id: dto.role },
      });
      if (!roleRow) {
        throw new BadRequestException('El rol de club indicado no existe.');
      }
      data.role = dto.role;
    }

    if (dto.specialization_ids !== undefined) {
      for (const sid of dto.specialization_ids) {
        const ex = await this.prisma.specialization.findUnique({
          where: { id: sid },
        });
        if (!ex) {
          throw new BadRequestException(`Especialización inválida: ${sid}`);
        }
      }
      data.s_specialization = this.encodeSpecialization(
        dto.specialization_ids,
      );
    }

    if (dto.password !== undefined && dto.password.length > 0) {
      data.password = await this.passwordHasher.hash(dto.password);
    }
    if (dto.first_name !== undefined) data.first_name = dto.first_name.trim();
    if (dto.middle_name !== undefined)
      data.middle_name = dto.middle_name?.trim() || null;
    if (dto.last_name !== undefined) data.last_name = dto.last_name.trim();
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.birth_date !== undefined)
      data.birth_date = new Date(dto.birth_date);
    if (dto.address !== undefined) data.address = dto.address.trim();
    if (dto.city !== undefined) data.city = dto.city.trim();
    if (dto.state !== undefined) data.state = dto.state?.trim() || null;
    if (dto.zipcode !== undefined) data.zipcode = dto.zipcode?.trim() || null;
    if (dto.mobile !== undefined) data.mobile = dto.mobile.trim();
    if (dto.phone !== undefined) data.phone = dto.phone?.trim() || null;
    if (dto.email !== undefined) data.email = dto.email.trim();

    await this.prisma.gymMember.update({ where: { id }, data });

    return this.findOne(id, actor);
  }

  async remove(id: number): Promise<{ ok: true }> {
    const m = await this.prisma.gymMember.findUnique({ where: { id } });
    if (!m || normalizeClubRole(m.role_name) !== 'staff_member') {
      throw new NotFoundException('Miembro del personal no encontrado.');
    }
    await this.prisma.gymMember.delete({ where: { id } });
    return { ok: true };
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
}
