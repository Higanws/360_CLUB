import { Repository } from 'typeorm';
import { GymRole } from '../entities/gym-role.entity';
import { GymMember } from '../entities/gym-member.entity';
import { Specialization } from '../entities/specialization.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
export type StaffListRow = {
    id: number;
    first_name: string | null;
    last_name: string | null;
    image: string | null;
    email: string | null;
    mobile: string | null;
    club_role_name: string | null;
};
export type StaffDetail = {
    id: number;
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    gender: string | null;
    birth_date: string | null;
    role: number | null;
    club_role_name: string | null;
    specialization_ids: number[];
    specialization_labels: string[];
    address: string | null;
    city: string | null;
    state: string | null;
    zipcode: string | null;
    mobile: string | null;
    phone: string | null;
    email: string | null;
    username: string | null;
    image: string | null;
    activated: number | null;
};
export declare class StaffService {
    private readonly members;
    private readonly gymRoles;
    private readonly specializations;
    constructor(members: Repository<GymMember>, gymRoles: Repository<GymRole>, specializations: Repository<Specialization>);
    encodeSpecialization(ids: number[]): string;
    decodeSpecialization(json: string | null): number[];
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
    listForUser(actor: {
        userId: number;
        role_name: string;
    }): Promise<{
        staff: StaffListRow[];
        meta: {
            can_manage: boolean;
            is_administrator: boolean;
        };
    }>;
    private assertCanViewStaff;
    findOne(id: number, actor: {
        userId: number;
        role_name: string;
    }): Promise<{
        staff: StaffDetail;
    }>;
    create(dto: CreateStaffDto): Promise<{
        staff: StaffDetail;
    }>;
    update(id: number, dto: UpdateStaffDto, actor: {
        userId: number;
        role_name: string;
    }): Promise<{
        staff: StaffDetail;
    }>;
    remove(id: number): Promise<{
        ok: true;
    }>;
    private assertUsernameAvailable;
}
