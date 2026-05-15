import axios from 'axios';

/** Base sin barra final (p. ej. `/api` o `http://localhost:3000/api`). */
export const apiBaseURL = (
  import.meta.env.VITE_API_URL ?? '/api'
).replace(/\/$/, '');

/** URL absoluta del API para `fetch` (mismo criterio que axios `baseURL`). */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (apiBaseURL.startsWith('http')) return `${apiBaseURL}${p}`;
  return `${apiBaseURL}${p}`;
}

export const api = axios.create({
  baseURL: apiBaseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

/** Idempotencia en POST (API Nest): huella 5s por defecto; cabecera opcional `Idempotency-Key` (UUID por acción) TTL 24h. */

export function setAuthHeader(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

/** Sesión inválida o expirada: AuthContext escucha y hace logout. */
export const SESSION_EXPIRED_EVENT = 'club360:session-expired';

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      (error as { response?: { status?: number } }).response?.status === 401
    ) {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  },
);
