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
exports.NutritionController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const business_role_guard_1 = require("../members/business-role.guard");
const roles_decorator_1 = require("../members/roles.decorator");
const upsert_nutrition_plan_dto_1 = require("./dto/upsert-nutrition-plan.dto");
const nutrition_service_1 = require("./nutrition.service");
let NutritionController = class NutritionController {
    constructor(nutrition) {
        this.nutrition = nutrition;
    }
    overview(req) {
        return this.nutrition.overview({
            userId: req.user.userId,
            role_name: req.user.role_name,
        });
    }
    getPlan(memberId, req) {
        return this.nutrition.getPlanForMember(memberId, {
            userId: req.user.userId,
            role_name: req.user.role_name,
        });
    }
    upsertPlan(memberId, dto, req) {
        return this.nutrition.upsertPlanForMember(memberId, dto, {
            userId: req.user.userId,
            role_name: req.user.role_name,
        });
    }
    deletePlan(memberId, req) {
        return this.nutrition.deletePlanForMember(memberId, {
            userId: req.user.userId,
            role_name: req.user.role_name,
        });
    }
};
exports.NutritionController = NutritionController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NutritionController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('members/:memberId/plan'),
    __param(0, (0, common_1.Param)('memberId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], NutritionController.prototype, "getPlan", null);
__decorate([
    (0, common_1.Put)('members/:memberId/plan'),
    __param(0, (0, common_1.Param)('memberId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, upsert_nutrition_plan_dto_1.UpsertNutritionPlanDto, Object]),
    __metadata("design:returntype", void 0)
], NutritionController.prototype, "upsertPlan", null);
__decorate([
    (0, common_1.Delete)('members/:memberId/plan'),
    __param(0, (0, common_1.Param)('memberId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], NutritionController.prototype, "deletePlan", null);
exports.NutritionController = NutritionController = __decorate([
    (0, common_1.Controller)('nutrition'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), business_role_guard_1.BusinessRoleGuard),
    (0, roles_decorator_1.BusinessRoles)(),
    __metadata("design:paramtypes", [nutrition_service_1.NutritionService])
], NutritionController);
//# sourceMappingURL=nutrition.controller.js.map