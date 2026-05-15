import {
  activityDifficultyLabel,
  routineDifficultyLabel,
} from '../../../src/lib/activity-difficulty';

describe('activities / activity-difficulty', () => {
  it('etiquetas en español', () => {
    expect(activityDifficultyLabel('baja')).toBe('Baja');
    expect(routineDifficultyLabel('mixta')).toBe('Mixta');
    expect(activityDifficultyLabel('???')).toBe('Media');
  });
});
