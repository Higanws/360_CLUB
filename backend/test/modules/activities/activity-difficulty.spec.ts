import { normalizeActivityDifficulty } from '../../../src/activities/activity-difficulty';

describe('activities / activity-difficulty', () => {
  it('normaliza nivel de actividad', () => {
    expect(normalizeActivityDifficulty(' ALTA ')).toBe('alta');
    expect(normalizeActivityDifficulty('x')).toBe('media');
  });
});
