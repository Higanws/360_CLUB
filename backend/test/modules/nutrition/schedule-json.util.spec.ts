import {
  dedupeNutritionSlots,
  parseMealsScheduleJson,
} from '../../../src/nutrition/schedule-json.util';

describe('nutrition / schedule-json.util', () => {
  it('parsea JSON de horarios y deduplica por weekday-hour', () => {
    const raw = JSON.stringify([
      { weekday: 1, hour: 8, event: 'Desayuno' },
      { weekday: 1, hour: 8, event: 'Otro' },
      { weekday: 1, hour: 25, event: 'Ignorar' },
    ]);
    const slots = parseMealsScheduleJson(raw);
    expect(slots).toHaveLength(1);
    expect(slots[0].event).toBe('Otro');
  });

  it('parsea dish e ingredientes opcionales', () => {
    const raw = JSON.stringify([
      {
        weekday: 1,
        hour: 8,
        event: 'Desayuno',
        dish: 'Bowl de yogur',
        ingredients: [
          { name: 'Yogur', quantity: '200 g' },
          { name: 'Avena', quantity: '40 g' },
        ],
      },
    ]);
    const slots = parseMealsScheduleJson(raw);
    expect(slots).toHaveLength(1);
    expect(slots[0].dish).toBe('Bowl de yogur');
    expect(slots[0].ingredients).toHaveLength(2);
    expect(slots[0].ingredients?.[0].name).toBe('Yogur');
  });

  it('dedupeNutritionSlots ordena por día y hora', () => {
    const out = dedupeNutritionSlots([
      { weekday: 2, hour: 10, event: 'B' },
      { weekday: 1, hour: 12, event: 'A' },
    ]);
    expect(out[0].weekday).toBe(1);
    expect(out[1].weekday).toBe(2);
  });
});
