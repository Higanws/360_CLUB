import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Membership } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';

export type MembershipRow = {
  id: number;
  membership_label: string | null;
  membership_amount: number | null;
  membership_period_days: number | null;
  installment_plan: string | null;
  signup_fee: number | null;
  description: string | null;
  image: string | null;
};

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  private toRow(m: Membership): MembershipRow {
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

  async list(): Promise<{ title: string; subtitle: string; memberships: MembershipRow[] }> {
    const rows = await this.prisma.membership.findMany({
      orderBy: { id: 'asc' },
    });
    return {
      title: 'Lista de membresías',
      subtitle: 'Afiliación',
      memberships: rows.map((m) => this.toRow(m)),
    };
  }

  async findOne(id: number): Promise<MembershipRow> {
    const m = await this.prisma.membership.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Membresía no encontrada.');
    return this.toRow(m);
  }

  async create(dto: CreateMembershipDto): Promise<MembershipRow> {
    const saved = await this.prisma.membership.create({
      data: {
        membership_label: dto.membership_label.trim(),
        membership_amount: dto.membership_amount,
        membership_period_days: dto.membership_period_days ?? null,
        installment_plan: dto.installment_plan?.trim() || null,
        signup_fee: dto.signup_fee ?? null,
        description: dto.description?.trim() || null,
        image: dto.image?.trim() || null,
      },
    });
    return this.toRow(saved);
  }

  async update(id: number, dto: UpdateMembershipDto): Promise<MembershipRow> {
    const m = await this.prisma.membership.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Membresía no encontrada.');

    const data: Partial<Membership> = {};
    if (dto.membership_label !== undefined) {
      data.membership_label = dto.membership_label.trim();
    }
    if (dto.membership_amount !== undefined) {
      data.membership_amount = dto.membership_amount;
    }
    if (dto.membership_period_days !== undefined) {
      data.membership_period_days = dto.membership_period_days;
    }
    if (dto.installment_plan !== undefined) {
      data.installment_plan = dto.installment_plan?.trim() || null;
    }
    if (dto.signup_fee !== undefined) {
      data.signup_fee = dto.signup_fee;
    }
    if (dto.description !== undefined) {
      data.description = dto.description?.trim() || null;
    }
    if (dto.image !== undefined) {
      data.image = dto.image?.trim() || null;
    }

    const saved = await this.prisma.membership.update({
      where: { id },
      data,
    });
    return this.toRow(saved);
  }

  async remove(id: number): Promise<{ ok: true }> {
    const m = await this.prisma.membership.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Membresía no encontrada.');

    const cnt = await this.prisma.membershipPayment.count({
      where: { membership_id: id },
    });
    if (cnt > 0) {
      throw new BadRequestException(
        'No se puede eliminar esta membresía porque hay pagos o registros asociados.',
      );
    }

    await this.prisma.membership.delete({ where: { id } });
    return { ok: true };
  }
}
