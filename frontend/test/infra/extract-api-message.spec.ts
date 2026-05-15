import { extractApiMessage } from '../../src/lib/extract-api-message';

describe('extract-api-message (infra)', () => {
  it('lee error string del body', () => {
    const err = {
      response: { data: { error: '  Credenciales inválidas  ' } },
    };
    expect(extractApiMessage(err)).toBe('Credenciales inválidas');
  });

  it('lee message array', () => {
    const err = { response: { data: { message: ['a', 'b'] } } };
    expect(extractApiMessage(err)).toBe('a, b');
  });

  it('cae en Error.message', () => {
    expect(extractApiMessage(new Error('fallo red'))).toBe('fallo red');
  });
});
