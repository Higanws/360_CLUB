import type { ValueTransformer } from 'typeorm';
export type NutritionScheduleSlot = {
    weekday: number;
    hour: number;
    event: string;
};
export declare function parseMealsScheduleJson(raw: unknown): NutritionScheduleSlot[];
export declare function dedupeNutritionSlots(slots: NutritionScheduleSlot[]): NutritionScheduleSlot[];
export declare function stringifyMealsScheduleJson(slots: NutritionScheduleSlot[] | null | undefined): string | null;
export declare const mealsScheduleLongtextTransformer: ValueTransformer;
