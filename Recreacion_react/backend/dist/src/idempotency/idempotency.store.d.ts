import { OnModuleDestroy } from '@nestjs/common';
import type { Observable } from 'rxjs';
type CompletedEntry = {
    statusCode: number;
    body: unknown;
    expiresAt: number;
};
export declare class IdempotencyStore implements OnModuleDestroy {
    private readonly logger;
    private readonly completed;
    private readonly inflight;
    private pruneTimer;
    readonly fingerprintTtlMs: number;
    readonly headerTtlMs: number;
    constructor();
    onModuleDestroy(): void;
    fingerprintKey(path: string, userKey: string, body: unknown): string;
    headerScopedKey(userKey: string, headerValue: string): string;
    getCompleted(key: string): CompletedEntry | null;
    setCompleted(key: string, statusCode: number, body: unknown, ttlMs: number): void;
    getInflight(key: string): Observable<unknown> | undefined;
    setInflight(key: string, obs: Observable<unknown>): void;
    deleteInflight(key: string): void;
    private prune;
}
export {};
