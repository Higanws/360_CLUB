import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { IdempotencyStore } from './idempotency.store';

const IDEMPOTENCY_HEADER = 'idempotency-key';

/** Rutas donde no aplicamos huella ni caché (login compartido, streaming). */
function isPostExcluded(path: string): boolean {
  const p = path.split('?')[0] ?? '';
  if (p.includes('/install/run-stream')) return true;
  if (p.endsWith('/auth/login') || p.includes('/auth/login')) return true;
  if (p.endsWith('/auth/refresh') || p.includes('/auth/refresh')) return true;
  return false;
}

function normalizeIdempotencyHeader(
  raw: string | string[] | undefined,
): string | null {
  if (raw === undefined) return null;
  const v = Array.isArray(raw) ? raw[0] : raw;
  const t = (v ?? '').trim();
  if (!t) return null;
  if (t.length > 256) return null;
  return t;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly store: IdempotencyStore) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    if (req.method !== 'POST') {
      return next.handle();
    }

    const path = req.originalUrl ?? req.url ?? '';
    if (isPostExcluded(path)) {
      return next.handle();
    }

    const user = (req as Request & { user?: { userId?: number } }).user;
    const userKey =
      user && typeof user.userId === 'number' ? `u${user.userId}` : 'anon';

    const headerKey = normalizeIdempotencyHeader(
      req.headers[IDEMPOTENCY_HEADER] ?? req.headers['Idempotency-Key'],
    );

    const storageKey = headerKey
      ? this.store.headerScopedKey(userKey, headerKey)
      : this.store.fingerprintKey(path, userKey, req.body);

    const ttlMs = headerKey ? this.store.headerTtlMs : this.store.fingerprintTtlMs;

    const cached = this.store.getCompleted(storageKey);
    if (cached) {
      res.status(cached.statusCode);
      res.setHeader('X-Idempotent-Replayed', 'true');
      return of(cached.body);
    }

    const inflight = this.store.getInflight(storageKey);
    if (inflight) {
      res.setHeader('X-Idempotent-Inflight', 'true');
      return inflight;
    }

    const shared$ = next.handle().pipe(
      tap((body) => {
        const code =
          res.statusCode >= 200 && res.statusCode < 300 ? res.statusCode : 0;
        if (code >= 200 && code < 300) {
          this.store.setCompleted(storageKey, code, body, ttlMs);
        }
      }),
      finalize(() => {
        this.store.deleteInflight(storageKey);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.store.setInflight(storageKey, shared$);
    return shared$;
  }
}
