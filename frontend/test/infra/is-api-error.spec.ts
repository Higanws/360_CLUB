import axios from 'axios';
import { apiErrorStatus, isApiError } from '../../src/lib/is-api-error';

describe('is-api-error (infra)', () => {
  it('detecta AxiosError y status', () => {
    const err = new axios.AxiosError('x', 'ERR', undefined, undefined, {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: {} as never,
      data: {},
    });
    expect(isApiError(err)).toBe(true);
    expect(apiErrorStatus(err)).toBe(403);
    expect(apiErrorStatus(new Error('no'))).toBeUndefined();
  });
});
