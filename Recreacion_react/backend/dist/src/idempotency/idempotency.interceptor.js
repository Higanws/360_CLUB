"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const idempotency_store_1 = require("./idempotency.store");
const IDEMPOTENCY_HEADER = 'idempotency-key';
function isPostExcluded(path) {
    const p = path.split('?')[0] ?? '';
    if (p.includes('/install/run-stream'))
        return true;
    if (p.endsWith('/auth/login') || p.includes('/auth/login'))
        return true;
    if (p.endsWith('/auth/refresh') || p.includes('/auth/refresh'))
        return true;
    return false;
}
function normalizeIdempotencyHeader(raw) {
    if (raw === undefined)
        return null;
    const v = Array.isArray(raw) ? raw[0] : raw;
    const t = (v ?? '').trim();
    if (!t)
        return null;
    if (t.length > 256)
        return null;
    return t;
}
let IdempotencyInterceptor = class IdempotencyInterceptor {
    constructor(store) {
        this.store = store;
    }
    intercept(context, next) {
        if (context.getType() !== 'http') {
            return next.handle();
        }
        const http = context.switchToHttp();
        const req = http.getRequest();
        const res = http.getResponse();
        if (req.method !== 'POST') {
            return next.handle();
        }
        const path = req.originalUrl ?? req.url ?? '';
        if (isPostExcluded(path)) {
            return next.handle();
        }
        const user = req.user;
        const userKey = user && typeof user.userId === 'number' ? `u${user.userId}` : 'anon';
        const headerKey = normalizeIdempotencyHeader(req.headers[IDEMPOTENCY_HEADER] ?? req.headers['Idempotency-Key']);
        const storageKey = headerKey
            ? this.store.headerScopedKey(userKey, headerKey)
            : this.store.fingerprintKey(path, userKey, req.body);
        const ttlMs = headerKey ? this.store.headerTtlMs : this.store.fingerprintTtlMs;
        const cached = this.store.getCompleted(storageKey);
        if (cached) {
            res.status(cached.statusCode);
            res.setHeader('X-Idempotent-Replayed', 'true');
            return (0, rxjs_1.of)(cached.body);
        }
        const inflight = this.store.getInflight(storageKey);
        if (inflight) {
            res.setHeader('X-Idempotent-Inflight', 'true');
            return inflight;
        }
        const shared$ = next.handle().pipe((0, operators_1.tap)((body) => {
            const code = res.statusCode >= 200 && res.statusCode < 300 ? res.statusCode : 0;
            if (code >= 200 && code < 300) {
                this.store.setCompleted(storageKey, code, body, ttlMs);
            }
        }), (0, operators_1.finalize)(() => {
            this.store.deleteInflight(storageKey);
        }), (0, operators_1.shareReplay)({ bufferSize: 1, refCount: true }));
        this.store.setInflight(storageKey, shared$);
        return shared$;
    }
};
exports.IdempotencyInterceptor = IdempotencyInterceptor;
exports.IdempotencyInterceptor = IdempotencyInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [idempotency_store_1.IdempotencyStore])
], IdempotencyInterceptor);
//# sourceMappingURL=idempotency.interceptor.js.map