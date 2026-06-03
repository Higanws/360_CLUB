import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseWeekday, resolveWeekday, weekdayLabel } from './weekday-parse.js';

describe('weekday-parse', () => {
  it('parseWeekday lunes', () => {
    assert.equal(parseWeekday('lunes'), 1);
  });

  it('parseWeekday number', () => {
    assert.equal(parseWeekday(3), 3);
  });

  it('resolveWeekday prefers name', () => {
    assert.equal(resolveWeekday(undefined, 'martes'), 2);
  });

  it('weekdayLabel', () => {
    assert.equal(weekdayLabel(1), 'lunes');
  });
});
