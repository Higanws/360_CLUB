import { ActivityDifficultyLevel } from '../activities/activity-difficulty';

/** Incluye `mixta` cuando una rutina combina actividades de distinto nivel. */
export const ROUTINE_DIFFICULTY_LEVELS = [
  'baja',
  'media',
  'alta',
  'mixta',
] as const;

export type RoutineDifficultyLevel = (typeof ROUTINE_DIFFICULTY_LEVELS)[number];

export function computeRoutineDifficulty(
  activityLevels: ActivityDifficultyLevel[],
): RoutineDifficultyLevel {
  if (activityLevels.length === 0) return 'media';
  const uniq = [...new Set(activityLevels)];
  if (uniq.length === 1) return uniq[0] as RoutineDifficultyLevel;
  return 'mixta';
}

export function normalizeRoutineDifficulty(
  raw: string | null | undefined,
): RoutineDifficultyLevel {
  const v = (raw ?? 'media').trim().toLowerCase();
  if ((ROUTINE_DIFFICULTY_LEVELS as readonly string[]).includes(v)) {
    return v as RoutineDifficultyLevel;
  }
  return 'media';
}
