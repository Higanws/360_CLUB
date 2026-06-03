import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  addMealToPlan,
  findSlot,
  removeMealFromPlan,
  updateMealInPlan,
  type NutritionPlan,
} from './nutrition-plan-merge.js';

const basePlan: NutritionPlan = {
  member_id: 1,
  schedule_slots: [
    {
      weekday: 1,
      hour: 13,
      event: 'Almuerzo',
      dish: 'Ensalada',
      ingredients: null,
    },
  ],
};

describe('nutrition-plan-merge', () => {
  it('findSlot by event', () => {
    const s = findSlot(basePlan.schedule_slots, {
      weekday: 1,
      mealEvent: 'Almuerzo',
    });
    assert.equal(s?.dish, 'Ensalada');
  });

  it('updateMealInPlan changes dish', () => {
    const next = updateMealInPlan(basePlan, {
      weekday: 1,
      mealEvent: 'Almuerzo',
      dish: 'Pollo',
    });
    assert.equal(next.schedule_slots[0]?.dish, 'Pollo');
  });

  it('addMealToPlan adds slot', () => {
    const next = addMealToPlan(basePlan, {
      weekday: 1,
      hour: 20,
      event: 'Cena',
      dish: 'Sopa',
    });
    assert.equal(next.schedule_slots.length, 2);
  });

  it('removeMealFromPlan removes slot', () => {
    const next = removeMealFromPlan(basePlan, {
      weekday: 1,
      mealEvent: 'Almuerzo',
    });
    assert.equal(next.schedule_slots.length, 0);
  });
});
