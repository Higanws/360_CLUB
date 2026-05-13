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
var IdempotencyStore_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyStore = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const stable_stringify_1 = require("./stable-stringify");
let IdempotencyStore = IdempotencyStore_1 = class IdempotencyStore {
    constructor() {
        this.logger = new common_1.Logger(IdempotencyStore_1.name);
        this.completed = new Map();
        this.inflight = new Map();
        this.pruneTimer = null;
        this.fingerprintTtlMs = parseInt(process.env.IDEMPOTENCY_FINGERPRINT_TTL_MS ?? '5000', 10);
        this.headerTtlMs = parseInt(process.env.IDEMPOTENCY_HEADER_TTL_MS ?? `${24 * 60 * 60 * 1000}`, 10);
        this.pruneTimer = setInterval(() => this.prune(), 60_000);
        this.pruneTimer.unref?.();
    }
    onModuleDestroy() {
        if (this.pruneTimer) {
            clearInterval(this.pruneTimer);
            this.pruneTimer = null;
        }
    }
    fingerprintKey(path, userKey, body) {
        const raw = `${path}\n${userKey}\n${(0, stable_stringify_1.stableStringify)(body ?? null)}`;
        const h = (0, crypto_1.createHash)('sha256').update(raw, 'utf8').digest('hex');
        return `fp:${h}`;
    }
    headerScopedKey(userKey, headerValue) {
        return `hk:${userKey}:${headerValue}`;
    }
    getCompleted(key) {
        const e = this.completed.get(key);
        if (!e)
            return null;
        if (Date.now() > e.expiresAt) {
            this.completed.delete(key);
            return null;
        }
        return e;
    }
    setCompleted(key, statusCode, body, ttlMs) {
        try {
            const clone = body !== undefined ? JSON.parse(JSON.stringify(body)) : body;
            this.completed.set(key, {
                statusCode,
                body: clone,
                expiresAt: Date.now() + ttlMs,
            });
        }
        catch {
            this.completed.set(key, {
                statusCode,
                body,
                expiresAt: Date.now() + ttlMs,
            });
        }
    }
    getInflight(key) {
        return this.inflight.get(key);
    }
    setInflight(key, obs) {
        this.inflight.set(key, obs);
    }
    deleteInflight(key) {
        this.inflight.delete(key);
    }
    prune() {
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
            this.logger.warn(`Idempotencia: caché grande (${this.completed.size}); revisa TTL o tráfico.`);
        }
    }
};
exports.IdempotencyStore = IdempotencyStore;
exports.IdempotencyStore = IdempotencyStore = IdempotencyStore_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], IdempotencyStore);
//# sourceMappingURL=idempotency.store.js.map