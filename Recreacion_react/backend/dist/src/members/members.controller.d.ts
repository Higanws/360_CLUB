import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembersService } from './members.service';
export declare class MembersController {
    private readonly members;
    constructor(members: MembersService);
    formOptions(): Promise<{
        staff: {
            id: number;
            label: string;
        }[];
        classes: {
            id: number;
            class_name: string | null;
        }[];
        memberships: {
            id: number;
            membership_label: string | null;
            amount: number | null;
        }[];
    }>;
    list(req: {
        user: {
            userId: number;
            role_name: string;
        };
    }): Promise<import("./members.service").MembersListResponse>;
    create(dto: CreateMemberDto, req: {
        user: {
            userId: number;
            role_name: string;
        };
    }): Promise<{
        member: import("./members.service").SafeMemberDetail;
    }>;
    findOne(id: number, req: {
        user: {
            userId: number;
            role_name: string;
        };
    }): Promise<{
        member: import("./members.service").SafeMemberDetail;
    }>;
    update(id: number, dto: UpdateMemberDto, req: {
        user: {
            userId: number;
            role_name: string;
        };
    }): Promise<{
        member: import("./members.service").SafeMemberDetail;
    }>;
    remove(id: number, req: {
        user: {
            userId: number;
            role_name: string;
        };
    }): Promise<{
        ok: true;
    }>;
}
