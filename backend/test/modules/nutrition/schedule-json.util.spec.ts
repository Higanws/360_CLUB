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

  it('dedupeNutritionSlots ordena por día y hora', () => {
    const out = dedupeNutritionSlots([
      { weekday: 2, hour: 10, event: 'B' },
      { weekday: 1, hour: 12, event: 'A' },
    ]);
    expect(out[0].weekday).toBe(1);
    expect(out[1].weekday).toBe(2);
  });
});
