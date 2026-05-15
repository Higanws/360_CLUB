import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from '../entities/membership.entity';
import { MembershipPayment } from '../entities/membership-payment.entity';
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
  constructor(
    @InjectRepository(Membership)
    private readonly plans: Repository<Membership>,
    @InjectRepository(MembershipPayment)
    private readonly payments: Repository<MembershipPayment>,
  ) {}

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
    const rows = await this.plans.find({ order: { id: 'ASC' } });
    return {
      title: 'Lista de membresías',
      subtitle: 'Afiliación',
      memberships: rows.map((m) => this.toRow(m)),
    };
  }

  async findOne(id: number): Promise<MembershipRow> {
    const m = await this.plans.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Membresía no encontrada.');
    return this.toRow(m);
  }

  async create(dto: CreateMembershipDto): Promise<MembershipRow> {
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

  async update(id: number, dto: UpdateMembershipDto): Promise<MembershipRow> {
    const m = await this.plans.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Membresía no encontrada.');

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

  async remove(id: number): Promise<{ ok: true }> {
    const m = await this.plans.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Membresía no encontrada.');

    const cnt = await this.payments.count({
      where: { membership_id: id },
    });
    if (cnt > 0) {
      throw new BadRequestException(
        'No se puede eliminar esta membresía porque hay pagos o registros asociados.',
      );
    }

    await this.plans.remove(m);
    return { ok: true };
  }
}
