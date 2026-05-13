export declare const ACTIVITY_DIFFICULTY_LEVELS: readonly ["baja", "media", "alta"];
export type ActivityDifficultyLevel = (typeof ACTIVITY_DIFFICULTY_LEVELS)[number];
export declare function normalizeActivityDifficulty(raw: string | null | undefined): ActivityDifficultyLevel;
