import { CheckAccessDto } from './dto/check-access.dto';
import { AccessControlService } from './access-control.service';
type JwtReq = {
    user: {
        userId: number;
        role_name: string;
    };
};
export declare class AccessControlController {
    private readonly access;
    constructor(access: AccessControlService);
    check(req: JwtReq, dto: CheckAccessDto): Promise<import("./access-control.service").AccessCheckResult>;
    recent(limitRaw?: string, from?: string, to?: string): Promise<{
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
    }[]>;
}
export {};
