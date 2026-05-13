import { ActivityDifficultyLevel } from '../activities/activity-difficulty';
export declare const ROUTINE_DIFFICULTY_LEVELS: readonly ["baja", "media", "alta", "mixta"];
export type RoutineDifficultyLevel = (typeof ROUTINE_DIFFICULTY_LEVELS)[number];
export declare function computeRoutineDifficulty(activityLevels: ActivityDifficultyLevel[]): RoutineDifficultyLevel;
export declare function normalizeRoutineDifficulty(raw: string | null | undefined): RoutineDifficultyLevel;
