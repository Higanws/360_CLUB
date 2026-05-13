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
export declare class MembershipsService {
    private readonly plans;
    private readonly payments;
    constructor(plans: Repository<Membership>, payments: Repository<MembershipPayment>);
    private toRow;
    list(): Promise<{
        title: string;
        subtitle: string;
        memberships: MembershipRow[];
    }>;
    findOne(id: number): Promise<MembershipRow>;
    create(dto: CreateMembershipDto): Promise<MembershipRow>;
    update(id: number, dto: UpdateMembershipDto): Promise<MembershipRow>;
    remove(id: number): Promise<{
        ok: true;
    }>;
}
