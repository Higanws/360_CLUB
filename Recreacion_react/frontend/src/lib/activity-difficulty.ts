/** Claves persistidas en API / BD (`activity.difficulty_level`). */
export type ActivityDifficultyLevel = 'baja' | 'media' | 'alta';

export const ACTIVITY_DIFFICULTY_LEVELS: readonly ActivityDifficultyLevel[] = [
  'baja',
  'media',
  'alta',
];

const LABELS: Record<ActivityDifficultyLevel, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
};

export function activityDifficultyLabel(
  key: string | null | undefined,
): string {
  const k = (key ?? 'media').trim().toLowerCase();
  if (k === 'baja' || k === 'media' || k === 'alta') {
    return LABELS[k];
  }
  return LABELS.media;
}

/** Nivel de rutina (`training_routine.difficulty_level`), incluye mixta. */
export function routineDifficultyLabel(key: string | null | undefined): string {
  const k = (key ?? 'media').trim().toLowerCase();
  if (k === 'mixta') return 'Mixta';
  return activityDifficultyLabel(k);
}
