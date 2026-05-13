import { Repository } from 'typeorm';
import { GeneralSetting } from '../entities/general-setting.entity';
import { GymMember } from '../entities/gym-member.entity';
import { NutritionPlan } from '../entities/nutrition-plan.entity';
import { UpsertNutritionPlanDto } from './dto/upsert-nutrition-plan.dto';
import { type NutritionScheduleSlot } from './schedule-json.util';
export type NutritionOverviewRow = {
    member_id: number;
    first_name: string | null;
    last_name: string | null;
    plan_id: number | null;
    valid_from: string | null;
    valid_to: string | null;
    meal_count: number;
};
export type NutritionPlanPayload = {
    member_id: number;
    first_name: string | null;
    last_name: string | null;
    valid_from: string | null;
    valid_to: string | null;
    schedule_slots: NutritionScheduleSlot[];
};
export declare class NutritionService {
    private readonly members;
    private readonly plans;
    private readonly settings;
    constructor(members: Repository<GymMember>, plans: Repository<NutritionPlan>, settings: Repository<GeneralSetting>);
    private assertBusinessRole;
    private settingsRow;
    private assertCanManageMember;
    overview(actor: {
        userId: number;
        role_name: string;
    }): Promise<{
        rows: NutritionOverviewRow[];
    }>;
    getPlanForMember(memberId: number, actor: {
        userId: number;
        role_name: string;
    }): Promise<{
        plan: NutritionPlanPayload | null;
    }>;
    upsertPlanForMember(memberId: number, dto: UpsertNutritionPlanDto, actor: {
        userId: number;
        role_name: string;
    }): Promise<{
        plan: NutritionPlanPayload;
    }>;
    deletePlanForMember(memberId: number, actor: {
        userId: number;
        role_name: string;
    }): Promise<{
        ok: true;
    }>;
}
