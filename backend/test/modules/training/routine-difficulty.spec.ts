import {
  computeRoutineDifficulty,
  normalizeRoutineDifficulty,
} from '../../../src/training/routine-difficulty';

describe('training / routine-difficulty', () => {
  it('computeRoutineDifficulty devuelve mixta si hay niveles distintos', () => {
    expect(computeRoutineDifficulty(['baja', 'alta'])).toBe('mixta');
    expect(computeRoutineDifficulty(['media'])).toBe('media');
    expect(computeRoutineDifficulty([])).toBe('media');
  });

  it('normalizeRoutineDifficulty cae en media si es inválido', () => {
    expect(normalizeRoutineDifficulty('INVALID')).toBe('media');
    expect(normalizeRoutineDifficulty('alta')).toBe('alta');
  });
});
