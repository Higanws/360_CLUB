import { MemberPreviewQueryDto } from './dto/member-preview-query.dto';
import { PatchWeeklyRoutineDto } from './dto/patch-weekly-routine.dto';
import { WeeklyRoutineQueryDto } from './dto/weekly-routine-query.dto';
import { MemberWellnessService } from './member-wellness.service';
type JwtReq = {
    user: {
        userId: number;
        role_name: string;
    };
};
export declare class MemberWellnessController {
    private readonly wellness;
    constructor(wellness: MemberWellnessService);
    myNutritionPlan(req: JwtReq, q: MemberPreviewQueryDto): Promise<{
        plan: import("./member-wellness.service").NutritionPlanPayload;
    }>;
    myTrainingContext(req: JwtReq, q: MemberPreviewQueryDto): Promise<{
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
    getWeeklyRoutine(req: JwtReq, q: WeeklyRoutineQueryDto): Promise<{
        week_start: string;
        routine_snapshot_json: Record<string, unknown> | null;
        updated_at: string | null;
    }>;
    patchWeeklyRoutine(req: JwtReq, dto: PatchWeeklyRoutineDto): Promise<{
        week_start: string;
        routine_snapshot_json: Record<string, unknown>;
        updated_at: string;
    }>;
}
export {};
