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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const business_role_guard_1 = require("../members/business-role.guard");
const roles_decorator_1 = require("../members/roles.decorator");
const dashboard_service_1 = require("./dashboard.service");
let DashboardController = class DashboardController {
    constructor(dashboard) {
        this.dashboard = dashboard;
    }
    businessMetrics() {
        return this.dashboard.getBusinessMetrics();
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('business-metrics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "businessMetrics", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)('dashboard'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), business_role_guard_1.BusinessRoleGuard),
    (0, roles_decorator_1.BusinessRoles)(),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map