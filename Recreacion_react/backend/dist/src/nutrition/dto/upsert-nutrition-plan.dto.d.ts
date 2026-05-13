export declare class NutritionScheduleSlotDto {
    weekday: number;
    hour: number;
    event: string;
}
export declare class UpsertNutritionPlanDto {
    valid_from?: string;
    valid_to?: string;
    schedule_slots: NutritionScheduleSlotDto[];
}
