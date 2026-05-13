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
exports.BusinessRoleGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const roles_decorator_1 = require("./roles.decorator");
let BusinessRoleGuard = class BusinessRoleGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const allowed = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]) ?? [];
        if (!allowed.length)
            return true;
        const req = context.switchToHttp().getRequest();
        const raw = (req.user?.role_name ?? '').trim().toLowerCase();
        const ok = allowed.some((r) => r.toLowerCase() === raw);
        if (!ok) {
            throw new common_1.ForbiddenException('Esta área es solo para personal del club (administración o staff).');
        }
        return true;
    }
};
exports.BusinessRoleGuard = BusinessRoleGuard;
exports.BusinessRoleGuard = BusinessRoleGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], BusinessRoleGuard);
//# sourceMappingURL=business-role.guard.js.map