import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IdempotencyStore } from './idempotency.store';
export declare class IdempotencyInterceptor implements NestInterceptor {
    private readonly store;
    constructor(store: IdempotencyStore);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
