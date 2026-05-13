import { UpsertNutritionPlanDto } from './dto/upsert-nutrition-plan.dto';
import { NutritionService } from './nutrition.service';
type JwtReq = {
    user: {
        userId: number;
        role_name: string;
    };
};
export declare class NutritionController {
    private readonly nutrition;
    constructor(nutrition: NutritionService);
    overview(req: JwtReq): Promise<{
        rows: import("./nutrition.service").NutritionOverviewRow[];
    }>;
    getPlan(memberId: number, req: JwtReq): Promise<{
        plan: import("./nutrition.service").NutritionPlanPayload | null;
    }>;
    upsertPlan(memberId: number, dto: UpsertNutritionPlanDto, req: JwtReq): Promise<{
        plan: import("./nutrition.service").NutritionPlanPayload;
    }>;
    deletePlan(memberId: number, req: JwtReq): Promise<{
        ok: true;
    }>;
}
export {};
