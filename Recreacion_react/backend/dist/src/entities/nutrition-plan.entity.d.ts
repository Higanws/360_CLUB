import { GymMember } from './gym-member.entity';
import { type NutritionScheduleSlot } from '../nutrition/schedule-json.util';
export declare class NutritionPlan {
    id: number;
    member_id: number;
    member: GymMember;
    valid_from: Date | string | null;
    valid_to: Date | string | null;
    meals_schedule_json: NutritionScheduleSlot[] | null;
    created_at: Date | null;
}
