import { randomUUID } from 'node:crypto';
import type { McpConfig } from '../config.js';
import { Club360ApiError, extractApiMessage } from './errors.js';

export type UserProfile = {
  id: number;
  username: string;
  role_name: string;
  first_name?: string | null;
  last_name?: string | null;
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
};

type RequestOpts = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  idempotent?: boolean;
};

export class Club360Client {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private user: UserProfile | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly config: McpConfig) {}

  get sessionUser(): UserProfile | null {
    return this.user;
  }

  async ensureAuthenticated(): Promise<UserProfile> {
    if (this.user && this.accessToken && Date.now() < this.tokenExpiresAt - 60_000) {
      return this.user;
    }
    if (this.refreshToken && this.accessToken) {
      try {
        await this.refresh();
        if (this.user) return this.user;
      } catch {
        /* login de nuevo */
      }
    }
    return this.login();
  }

  async login(): Promise<UserProfile> {
    const data = await this.rawRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: {
        username: this.config.username,
        password: this.config.password,
      },
      skipAuth: true,
    });
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.user = {
      id: data.user.id,
      username: data.user.username,
      role_name: data.user.role_name,
      first_name: data.user.first_name,
      last_name: data.user.last_name,
    };
    this.tokenExpiresAt = Date.now() + 29 * 60 * 1000;
    return this.user;
  }

  async refresh(): Promise<void> {
    if (!this.refreshToken) throw new Error('Sin refresh token');
    const data = await this.rawRequest<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      {
        method: 'POST',
        body: { refreshToken: this.refreshToken },
        skipAuth: true,
      },
    );
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.tokenExpiresAt = Date.now() + 29 * 60 * 1000;
  }

  async getMe(): Promise<UserProfile> {
    await this.ensureAuthenticated();
    const me = await this.request<UserProfile>('/auth/me');
    this.user = me;
    return me;
  }

  async request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
    await this.ensureAuthenticated();
    return this.rawRequest<T>(path, { ...opts, skipAuth: false });
  }

  private async rawRequest<T>(
    path: string,
    opts: RequestOpts & { skipAuth?: boolean },
  ): Promise<T> {
    const url = new URL(
      path.startsWith('http') ? path : `${this.config.apiUrl}${path.startsWith('/') ? path : `/${path}`}`,
    );
    if (opts.query) {
      for (const [k, v] of Object.entries(opts.query)) {
        if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
      }
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (opts.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (!opts.skipAuth && this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }
    if (opts.idempotent !== false && (opts.method ?? 'GET') === 'POST') {
      headers['Idempotency-Key'] = randomUUID();
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      const res = await fetch(url, {
        method: opts.method ?? 'GET',
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
      });

      const text = await res.text();
      let parsed: unknown = null;
      if (text) {
        try {
          parsed = JSON.parse(text) as unknown;
        } catch {
          parsed = text;
        }
      }

      if (!res.ok) {
        const msg =
          extractApiMessage(parsed) || res.statusText || `HTTP ${res.status}`;
        throw new Club360ApiError(msg, res.status, parsed);
      }

      return parsed as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
