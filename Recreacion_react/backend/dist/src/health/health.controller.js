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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const typeorm_1 = require("typeorm");
let HealthController = class HealthController {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async database() {
        try {
            await this.dataSource.query('SELECT 1 AS ok');
            const dbName = this.dataSource.options.database ?? null;
            let smoke = null;
            try {
                const cntRows = (await this.dataSource.query('SELECT COUNT(*) AS c FROM gym_member'));
                const gymMemberCount = Number(cntRows[0]?.c ?? 0);
                const adminRows = (await this.dataSource.query('SELECT username, CHAR_LENGTH(password) AS plen FROM gym_member WHERE id = 1 LIMIT 1'));
                const ar = adminRows[0];
                const plen = ar?.plen != null ? Number(ar.plen) : null;
                const pfxRows = (await this.dataSource.query('SELECT LEFT(password, 3) AS p FROM gym_member WHERE id = 1 LIMIT 1'));
                const p = pfxRows[0]?.p ?? '';
                smoke = {
                    gymMemberCount,
                    adminId1Username: ar?.username ?? null,
                    adminPasswordHashLen: plen,
                    adminBcryptPrefixOk: p === '$2a' || p === '$2b' || p === '$2y',
                };
            }
            catch {
                smoke = null;
            }
            return {
                ok: true,
                driver: 'mysql',
                database: dbName,
                smoke,
            };
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new common_1.ServiceUnavailableException({
                ok: false,
                driver: 'mysql',
                error: msg,
            });
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)('database'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "database", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    (0, throttler_1.SkipThrottle)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], HealthController);
//# sourceMappingURL=health.controller.js.map