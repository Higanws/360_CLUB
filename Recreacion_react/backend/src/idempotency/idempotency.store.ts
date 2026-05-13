import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createHash } from 'crypto';
import type { Observable } from 'rxjs';
import { stableStringify } from './stable-stringify';

type CompletedEntry = {
  statusCode: number;
  body: unknown;
  expiresAt: number;
};

@Injectable()
export class IdempotencyStore implements OnModuleDestroy {
  private readonly logger = new Logger(IdempotencyStore.name);
  private readonly completed = new Map<string, CompletedEntry>();
  private readonly inflight = new Map<string, Observable<unknown>>();
  private pruneTimer: ReturnType<typeof setInterval> | null = null;

  /** TTL huella sin cabecera (ms). */
  readonly fingerprintTtlMs: number;
  /** TTL con cabecera Idempotency-Key (ms). */
  readonly headerTtlMs: number;

  constructor() {
    this.fingerprintTtlMs = parseInt(
      process.env.IDEMPOTENCY_FINGERPRINT_TTL_MS ?? '5000',
      10,
    );
    this.headerTtlMs = parseInt(
      process.env.IDEMPOTENCY_HEADER_TTL_MS ?? `${24 * 60 * 60 * 1000}`,
      10,
    );
    this.pruneTimer = setInterval(() => this.prune(), 60_000);
    this.pruneTimer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }
  }

  fingerprintKey(path: string, userKey: string, body: unknown): string {
    const raw = `${path}\n${userKey}\n${stableStringify(body ?? null)}`;
    const h = createHash('sha256').update(raw, 'utf8').digest('hex');
    return `fp:${h}`;
  }

  headerScopedKey(userKey: string, headerValue: string): string {
    return `hk:${userKey}:${headerValue}`;
  }

  getCompleted(key: string): CompletedEntry | null {
    const e = this.completed.get(key);
    if (!e) return null;
    if (Date.now() > e.expiresAt) {
      this.completed.delete(key);
      return null;
    }
    return e;
  }

  setCompleted(key: string, statusCode: number, body: unknown, ttlMs: number): void {
    try {
      const clone = body !== undefined ? JSON.parse(JSON.stringify(body)) : body;
      this.completed.set(key, {
        statusCode,
        body: clone,
        expiresAt: Date.now() + ttlMs,
      });
    } catch {
      this.completed.set(key, {
        statusCode,
        body,
        expiresAt: Date.now() + ttlMs,
      });
    }
  }

  getInflight(key: string): Observable<unknown> | undefined {
    return this.inflight.get(key);
  }

  setInflight(key: string, obs: Observable<unknown>): void {
    this.inflight.set(key, obs);
  }

  deleteInflight(key: string): void {
    this.inflight.delete(key);
  }

  private prune(): void {
    const now = Date.now();
    let n = 0;
    for (const [k, v] of this.completed) {
      if (v.expiresAt <= now) {
        this.completed.delete(k);
        n++;
      }
    }
    if (n > 0) {
      this.logger.debug(`Idempotencia: entradas caducadas eliminadas (${n}).`);
    }
    if (this.completed.size > 50_000) {
      this.logger.warn(
        `Idempotencia: caché grande (${this.completed.size}); revisa TTL o tráfico.`,
      );
    }
  }
}
