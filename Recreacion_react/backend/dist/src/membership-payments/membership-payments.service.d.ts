import { Repository } from 'typeorm';
import { GeneralSetting } from '../entities/general-setting.entity';
import { GymMember } from '../entities/gym-member.entity';
import { MembershipPayment } from '../entities/membership-payment.entity';
import { Membership } from '../entities/membership.entity';
import { ManualMembershipPaymentDto } from './dto/manual-membership-payment.dto';
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
export declare class MembershipPaymentsService {
    private readonly payments;
    private readonly members;
    private readonly plans;
    private readonly settings;
    constructor(payments: Repository<MembershipPayment>, members: Repository<GymMember>, plans: Repository<Membership>, settings: Repository<GeneralSetting>);
    private settingsRow;
    listExpiringThisMonth(actor: {
        userId: number;
        role_name: string;
    }): Promise<{
        title: string;
        subtitle: string;
        rows: ExpiringPaymentRow[];
    }>;
    manualFormOptions(actor: {
        userId: number;
        role_name: string;
    }): Promise<{
        members: {
            id: number;
            label: string;
        }[];
        memberships: {
            id: number;
            label: string | null;
            amount: number | null;
        }[];
    }>;
    registerManual(dto: ManualMembershipPaymentDto, actor: {
        userId: number;
        role_name: string;
    }): Promise<{
        ok: true;
        mp_id: number;
    }>;
    markPaid(mpId: number, actor: {
        userId: number;
        role_name: string;
    }): Promise<{
        ok: true;
    }>;
}
