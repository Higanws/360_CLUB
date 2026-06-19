import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateBatchItems } from './batch-runner.js';

describe('migration batch validate', () => {
  it('valida membership_plan', () => {
    const r = validateBatchItems(
      'membership_plan',
      [{ source_id: 'p1', membership_label: 'Mensual', membership_amount: 49 }],
      {},
    );
    assert.equal(r.succeeded, 1);
    assert.equal(r.failed, 0);
  });

  it('falla member sin campos obligatorios', () => {
    const r = validateBatchItems('member', [{ first_name: 'Ana' }], {});
    assert.equal(r.succeeded, 0);
    assert.equal(r.failed, 1);
  });

  it('resuelve membership_ref en member', () => {
    const r = validateBatchItems(
      'member',
      [
        {
          source_id: 'm1',
          first_name: 'Ana',
          last_name: 'G',
          username: 'ana.g',
          password: 'secret1',
          gender: 'female',
          di_dni_type: 'DNI',
          di_dni_number: '123',
          membership_ref: 'plan-1',
        },
      ],
      { 'plan-1': 5 },
    );
    assert.equal(r.succeeded, 1);
  });

  it('falla activity sin category_ref en id_map', () => {
    const r = validateBatchItems(
      'activity',
      [
        {
          title: 'Press',
          difficulty_level: 'media',
          video_urls: [],
          category_ref: 'cat-x',
          trainer_refs: ['t1'],
        },
      ],
      { t1: 2 },
    );
    assert.equal(r.failed, 1);
  });
});
