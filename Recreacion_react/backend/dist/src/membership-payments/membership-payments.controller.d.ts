import { ManualMembershipPaymentDto } from './dto/manual-membership-payment.dto';
import { MembershipPaymentsService } from './membership-payments.service';
export declare class MembershipPaymentsController {
    private readonly svc;
    constructor(svc: MembershipPaymentsService);
    expiring(req: {
        user: {
            userId: number;
            role_name: string;
        };
    }): Promise<{
        title: string;
        subtitle: string;
        rows: import("./membership-payments.service").ExpiringPaymentRow[];
    }>;
    formOptions(req: {
        user: {
            userId: number;
            role_name: string;
        };
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
    manual(dto: ManualMembershipPaymentDto, req: {
        user: {
            userId: number;
            role_name: string;
        };
    }): Promise<{
        ok: true;
        mp_id: number;
    }>;
    markPaid(mpId: number, req: {
        user: {
            userId: number;
            role_name: string;
        };
    }): Promise<{
        ok: true;
    }>;
}
