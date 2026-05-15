import { stableStringify } from '../../../src/idempotency/stable-stringify';

describe('stable-stringify (infra)', () => {
  it('ordena claves de objetos', () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it('es estable con claves en distinto orden', () => {
    const a = stableStringify({ x: 1, y: { z: 3, w: 2 } });
    const b = stableStringify({ y: { w: 2, z: 3 }, x: 1 });
    expect(a).toBe(b);
  });
});
