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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessControlController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const business_role_guard_1 = require("../members/business-role.guard");
const roles_decorator_1 = require("../members/roles.decorator");
const check_access_dto_1 = require("./dto/check-access.dto");
const access_control_service_1 = require("./access-control.service");
let AccessControlController = class AccessControlController {
    constructor(access) {
        this.access = access;
    }
    async check(req, dto) {
        const record = dto.record !== false;
        return this.access.checkAndRecord(req.user, dto.lookup, record);
    }
    recent(limitRaw, from, to) {
        const n = parseInt(limitRaw ?? '100', 10);
        const limit = Number.isFinite(n) ? n : 100;
        return this.access.recentLogs(limit, from?.trim(), to?.trim());
    }
};
exports.AccessControlController = AccessControlController;
__decorate([
    (0, common_1.Post)('check'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, check_access_dto_1.CheckAccessDto]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('recent'),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AccessControlController.prototype, "recent", null);
exports.AccessControlController = AccessControlController = __decorate([
    (0, common_1.Controller)('access-control'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), business_role_guard_1.BusinessRoleGuard),
    (0, roles_decorator_1.BusinessRoles)(),
    __metadata("design:paramtypes", [access_control_service_1.AccessControlService])
], AccessControlController);
//# sourceMappingURL=access-control.controller.js.map