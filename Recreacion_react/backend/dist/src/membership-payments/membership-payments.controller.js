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
exports.MembershipPaymentsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const business_role_guard_1 = require("../members/business-role.guard");
const roles_decorator_1 = require("../members/roles.decorator");
const manual_membership_payment_dto_1 = require("./dto/manual-membership-payment.dto");
const membership_payments_service_1 = require("./membership-payments.service");
let MembershipPaymentsController = class MembershipPaymentsController {
    constructor(svc) {
        this.svc = svc;
    }
    expiring(req) {
        return this.svc.listExpiringThisMonth({
            userId: req.user.userId,
            role_name: req.user.role_name,
        });
    }
    formOptions(req) {
        return this.svc.manualFormOptions({
            userId: req.user.userId,
            role_name: req.user.role_name,
        });
    }
    manual(dto, req) {
        return this.svc.registerManual(dto, {
            userId: req.user.userId,
            role_name: req.user.role_name,
        });
    }
    markPaid(mpId, req) {
        return this.svc.markPaid(mpId, {
            userId: req.user.userId,
            role_name: req.user.role_name,
        });
    }
};
exports.MembershipPaymentsController = MembershipPaymentsController;
__decorate([
    (0, common_1.Get)('expiring-this-month'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MembershipPaymentsController.prototype, "expiring", null);
__decorate([
    (0, common_1.Get)('form-options'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MembershipPaymentsController.prototype, "formOptions", null);
__decorate([
    (0, common_1.Post)('manual'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [manual_membership_payment_dto_1.ManualMembershipPaymentDto, Object]),
    __metadata("design:returntype", void 0)
], MembershipPaymentsController.prototype, "manual", null);
__decorate([
    (0, common_1.Patch)(':mpId/paid'),
    __param(0, (0, common_1.Param)('mpId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], MembershipPaymentsController.prototype, "markPaid", null);
exports.MembershipPaymentsController = MembershipPaymentsController = __decorate([
    (0, common_1.Controller)('payments/membership'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), business_role_guard_1.BusinessRoleGuard),
    (0, roles_decorator_1.BusinessRoles)(),
    __metadata("design:paramtypes", [membership_payments_service_1.MembershipPaymentsService])
], MembershipPaymentsController);
//# sourceMappingURL=membership-payments.controller.js.map