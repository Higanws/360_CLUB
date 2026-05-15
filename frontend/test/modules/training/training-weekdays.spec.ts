import {
  hasRoutineWeekday,
  ROUTINE_WEEKDAY_BITS,
  toggleRoutineWeekday,
} from '../../../src/lib/training-weekdays';

describe('training / training-weekdays', () => {
  it('hasRoutineWeekday comprueba bitmask', () => {
    expect(hasRoutineWeekday(5, ROUTINE_WEEKDAY_BITS[0])).toBe(true);
    expect(hasRoutineWeekday(4, ROUTINE_WEEKDAY_BITS[0])).toBe(false);
  });

  it('toggleRoutineWeekday no deja máscara en cero', () => {
    expect(toggleRoutineWeekday(1, 1)).toBe(1);
    expect(toggleRoutineWeekday(3, 2)).toBe(1);
  });
});
