import axios from 'axios';
import { api } from './api';

/** Endpoints que solo responden con el stack completo (post-reinicio del backend). */
export async function isApiFullyBooted(): Promise<boolean> {
  try {
    const res = await api.get<{ ok?: boolean }>('/health/database');
    if (res.status === 200 && res.data?.ok === true) {
      return true;
    }
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 503) {
      return true;
    }
  }

  try {
    await api.get('/auth/me');
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const s = e.response?.status;
      if (s === 401 || s === 403) {
        return true;
      }
    }
  }

  try {
    const res = await api.get('/settings/branding');
    return res.status === 200;
  } catch {
    return false;
  }
}

/** Espera a que la API reinicie y cargue TypeORM/Auth (Docker tras el wizard). */
export async function waitForApiBoot(
  maxAttempts = 45,
  delayMs = 2000,
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
    try {
      const status = await api.get<{ installed: boolean }>('/install/status');
      if (!status.data?.installed) {
        continue;
      }
      if (await isApiFullyBooted()) {
        return true;
      }
    } catch {
      /* API reiniciando */
    }
  }
  return false;
}
