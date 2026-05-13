import { Repository } from 'typeorm';
import { ClassSchedule } from '../entities/class-schedule.entity';
import { GeneralSetting } from '../entities/general-setting.entity';
import { GymMemberClass } from '../entities/gym-member-class.entity';
import { GymMember } from '../entities/gym-member.entity';
import { MembershipPayment } from '../entities/membership-payment.entity';
import { Membership } from '../entities/membership.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
export type MembersListRow = {
    id: number;
    activated: number | null;
    member_id: string | null;
    first_name: string | null;
    last_name: string | null;
    image: string | null;
    membership_status: string | null;
    membership_valid_from: string | null;
    membership_valid_to: string | null;
};
export type MembersListResponse = {
    title: string;
    subtitle: string;
    members: MembersListRow[];
    meta: {
        role_name: string;
        can_add_member: boolean;
        show_status_column: boolean;
        date_format: string | null;
    };
};
export type SafeMemberDetail = {
    id: number;
    activated: number | null;
    member_id: string | null;
    di_dni_type: string | null;
    di_dni_number: string | null;
    first_name: string | null;
    last_name: string | null;
    gender: string | null;
    birth_date: string | null;
    email: string | null;
    username: string | null;
    mobile: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipcode: string | null;
    image: string | null;
    assign_staff_mem: number | null;
    selected_membership: string | null;
    membership_status: string | null;
    membership_valid_from: string | null;
    membership_valid_to: string | null;
    inquiry_date: string | null;
    trial_end_date: string | null;
    first_pay_date: string | null;
    created_date: string | null;
    assign_class_ids: number[];
    physical_weight_kg: number | null;
    physical_height_cm: number | null;
    physical_chest_cm: number | null;
    physical_waist_cm: number | null;
    physical_thigh_cm: number | null;
    physical_arms_cm: number | null;
    physical_fat_percent: number | null;
};
export declare class MembersService {
    private readonly members;
    private readonly settings;
    private readonly memberClass;
    private readonly membership;
    private readonly membershipPayment;
    private readonly classSchedule;
    constructor(members: Repository<GymMember>, settings: Repository<GeneralSetting>, memberClass: Repository<GymMemberClass>, membership: Repository<Membership>, membershipPayment: Repository<MembershipPayment>, classSchedule: Repository<ClassSchedule>);
    private settingsRow;
    private assertBusinessRole;
    private memberTypeToStatus;
    private formatMemberCode;
    private parseOptionalDate;
    assertCanManageMember(actor: {
        userId: number;
        role_name: string;
    }, member: GymMember): Promise<void>;
    private assertUsernameAvailable;
    private assertDniAvailable;
    private toSafeDetail;
    listForUser(payload: {
        userId: number;
        role_name: string;
    }): Promise<MembersListResponse>;
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
    findOne(id: number, actor: {
        userId: number;
        role_name: string;
    }): Promise<{
        member: SafeMemberDetail;
    }>;
    create(dto: CreateMemberDto, actor: {
        userId: number;
        role_name: string;
    }): Promise<{
        member: SafeMemberDetail;
    }>;
    private replaceClassAssignments;
    private insertMembershipPaymentIfNeeded;
    update(id: number, dto: UpdateMemberDto, actor: {
        userId: number;
        role_name: string;
    }): Promise<{
        member: SafeMemberDetail;
    }>;
    remove(id: number, actor: {
        userId: number;
        role_name: string;
    }): Promise<{
        ok: true;
    }>;
}
