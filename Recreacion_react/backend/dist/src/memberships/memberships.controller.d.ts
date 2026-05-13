import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { MembershipsService } from './memberships.service';
export declare class MembershipsController {
    private readonly memberships;
    constructor(memberships: MembershipsService);
    list(): Promise<{
        title: string;
        subtitle: string;
        memberships: import("./memberships.service").MembershipRow[];
    }>;
    findOne(id: number): Promise<import("./memberships.service").MembershipRow>;
    create(dto: CreateMembershipDto): Promise<import("./memberships.service").MembershipRow>;
    update(id: number, dto: UpdateMembershipDto): Promise<import("./memberships.service").MembershipRow>;
    remove(id: number): Promise<{
        ok: true;
    }>;
}
