import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffService } from './staff.service';
export declare class StaffController {
    private readonly staff;
    constructor(staff: StaffService);
    formOptions(): Promise<{
        club_roles: {
            id: number;
            name: string | null;
        }[];
        specializations: {
            id: number;
            name: string | null;
        }[];
    }>;
    list(req: {
        user: {
            userId: number;
            role_name: string;
        };
    }): Promise<{
        staff: import("./staff.service").StaffListRow[];
        meta: {
            can_manage: boolean;
            is_administrator: boolean;
        };
    }>;
    create(dto: CreateStaffDto): Promise<{
        staff: import("./staff.service").StaffDetail;
    }>;
    findOne(id: number, req: {
        user: {
            userId: number;
            role_name: string;
        };
    }): Promise<{
        staff: import("./staff.service").StaffDetail;
    }>;
    update(id: number, dto: UpdateStaffDto, req: {
        user: {
            userId: number;
            role_name: string;
        };
    }): Promise<{
        staff: import("./staff.service").StaffDetail;
    }>;
    remove(id: number): Promise<{
        ok: true;
    }>;
}
