/** Nivel de dificultad de una actividad (ejercicio). Valores persistidos en MySQL. */
export const ACTIVITY_DIFFICULTY_LEVELS = ['baja', 'media', 'alta'] as const;

export type ActivityDifficultyLevel =
  (typeof ACTIVITY_DIFFICULTY_LEVELS)[number];

export function normalizeActivityDifficulty(
  raw: string | null | undefined,
): ActivityDifficultyLevel {
  const v = (raw ?? 'media').trim().toLowerCase();
  if ((ACTIVITY_DIFFICULTY_LEVELS as readonly string[]).includes(v)) {
    return v as ActivityDifficultyLevel;
  }
  return 'media';
}
