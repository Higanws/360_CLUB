import axios from 'axios';

export function isApiError(err: unknown): err is import('axios').AxiosError {
  return axios.isAxiosError(err);
}

export function apiErrorStatus(err: unknown): number | undefined {
  return isApiError(err) ? err.response?.status : undefined;
}
