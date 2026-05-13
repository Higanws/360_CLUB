import { Repository } from 'typeorm';
import { GeneralSetting } from '../entities/general-setting.entity';
import { GymMember } from '../entities/gym-member.entity';
import { MemberWeeklyRoutine } from '../entities/member-weekly-routine.entity';
import { NutritionPlan } from '../entities/nutrition-plan.entity';
import { TrainingAssignment } from '../entities/training-assignment.entity';
import type { NutritionScheduleSlot } from '../nutrition/schedule-json.util';
import type { PatchWeeklyRoutineDto } from './dto/patch-weekly-routine.dto';
export type NutritionPlanPayload = {
    member_id: number;
    first_name: string | null;
    last_name: string | null;
    valid_from: string | null;
    valid_to: string | null;
    schedule_slots: NutritionScheduleSlot[];
};
type JwtActor = {
    userId: number;
    role_name: string;
};
export declare class MemberWellnessService {
    private readonly settings;
    private readonly members;
    private readonly plans;
    private readonly assignments;
    private readonly weeklyRows;
    private static readonly SNAPSHOT_JSON_MAX;
    constructor(settings: Repository<GeneralSetting>, members: Repository<GymMember>, plans: Repository<NutritionPlan>, assignments: Repository<TrainingAssignment>, weeklyRows: Repository<MemberWeeklyRoutine>);
    private settingsRow;
    private assertStaffCanViewMember;
    private resolveTargetMember;
    getMyNutritionPlan(actor: JwtActor, memberIdParam?: number): Promise<{
        plan: NutritionPlanPayload;
    }>;
    getMyTrainingContext(actor: JwtActor, memberIdParam?: number): Promise<{
        week_start_default: string;
        assignment: null | {
            id: number;
            routine_id: number;
            routine_title: string;
            created_at: string;
            lines: Array<{
                id: number;
                activity_id: number;
                title: string;
                sort_order: number;
                weight_kg: number | null;
                weekdays_mask: number;
                day_keys: string[];
            }>;
        };
    }>;
    getWeeklyRoutine(actor: JwtActor, weekStartParam?: string, memberIdParam?: number): Promise<{
        week_start: string;
        routine_snapshot_json: Record<string, unknown> | null;
        updated_at: string | null;
    }>;
    patchWeeklyRoutine(actor: JwtActor, dto: PatchWeeklyRoutineDto): Promise<{
        week_start: string;
        routine_snapshot_json: Record<string, unknown>;
        updated_at: string;
    }>;
}
export {};
