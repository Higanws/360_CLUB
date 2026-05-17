import { describe, expect, it } from 'vitest';
import {
  mealLinesToSlots,
  slotsToMealLines,
  type MealLineForm,
} from '../../../src/lib/nutrition-meals';
import { ROUTINE_WEEKDAYS_ALL_MASK } from '../../../src/lib/training-weekdays';

describe('nutrition-meals', () => {
  it('expande una comida a un slot por día activo', () => {
    const lines: MealLineForm[] = [
      {
        clientId: 'a',
        name: 'Desayuno',
        description: 'Yogur con avena',
        ingredients: [{ name: 'Yogur', quantity: '200 g' }],
        hour: 8,
        weekdaysMask: 1 | 2, // lun + mar
      },
    ];
    const slots = mealLinesToSlots(lines);
    expect(slots).toHaveLength(2);
    expect(slots.map((s) => s.weekday).sort()).toEqual([1, 2]);
    expect(slots.every((s) => s.hour === 8 && s.event === 'Desayuno')).toBe(true);
    expect(slots[0]?.dish).toBe('Yogur con avena');
  });

  it('agrupa slots del API en una línea por comida/hora', () => {
    const slots = mealLinesToSlots([
      {
        clientId: 'x',
        name: 'Almuerzo',
        description: '',
        ingredients: [],
        hour: 13,
        weekdaysMask: ROUTINE_WEEKDAYS_ALL_MASK,
      },
    ]);
    const lines = slotsToMealLines(slots);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.name).toBe('Almuerzo');
    expect(lines[0]?.hour).toBe(13);
    expect(lines[0]?.weekdaysMask).toBe(127);
  });
});
