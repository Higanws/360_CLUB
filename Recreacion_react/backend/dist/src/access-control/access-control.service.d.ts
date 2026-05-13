import { Repository } from 'typeorm';
import { ClubAccessLog } from '../entities/club-access-log.entity';
import { GeneralSetting } from '../entities/general-setting.entity';
import { GymMember } from '../entities/gym-member.entity';
import { MembershipPayment } from '../entities/membership-payment.entity';
export declare function normalizeMemberLookupToken(raw: string): string;
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
type JwtActor = {
    userId: number;
    role_name: string;
};
export declare class AccessControlService {
    private readonly settings;
    private readonly members;
    private readonly payments;
    private readonly logs;
    private readonly logger;
    constructor(settings: Repository<GeneralSetting>, members: Repository<GymMember>, payments: Repository<MembershipPayment>, logs: Repository<ClubAccessLog>);
    private settingsRow;
    private assertStaffMayViewMember;
    findMemberByLookup(lookupRaw: string): Promise<GymMember | null>;
    private latestPaymentEnd;
    private cycleTypeFromRange;
    evaluateMemberAccess(member: GymMember): Promise<{
        valid: boolean;
        status: string;
        message: string;
        due_date: string | null;
        cycle_type: string;
        days_remaining: number | null;
        days_overdue: number | null;
    }>;
    private alreadyAllowedToday;
    checkAndRecord(actor: JwtActor, lookupRaw: string, record: boolean): Promise<AccessCheckResult>;
    private isYmd;
    recentLogs(limit: number, fromYmd?: string | null, toYmd?: string | null): Promise<Array<{
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
    }>>;
}
export {};
