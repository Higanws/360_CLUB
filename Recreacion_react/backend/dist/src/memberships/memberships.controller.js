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
exports.MembershipsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const business_role_guard_1 = require("../members/business-role.guard");
const roles_decorator_1 = require("../members/roles.decorator");
const create_membership_dto_1 = require("./dto/create-membership.dto");
const update_membership_dto_1 = require("./dto/update-membership.dto");
const membership_admin_guard_1 = require("./membership-admin.guard");
const memberships_service_1 = require("./memberships.service");
let MembershipsController = class MembershipsController {
    constructor(memberships) {
        this.memberships = memberships;
    }
    list() {
        return this.memberships.list();
    }
    findOne(id) {
        return this.memberships.findOne(id);
    }
    create(dto) {
        return this.memberships.create(dto);
    }
    update(id, dto) {
        return this.memberships.update(id, dto);
    }
    remove(id) {
        return this.memberships.remove(id);
    }
};
exports.MembershipsController = MembershipsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(membership_admin_guard_1.MembershipAdminGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_membership_dto_1.CreateMembershipDto]),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(membership_admin_guard_1.MembershipAdminGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_membership_dto_1.UpdateMembershipDto]),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(membership_admin_guard_1.MembershipAdminGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "remove", null);
exports.MembershipsController = MembershipsController = __decorate([
    (0, common_1.Controller)('memberships'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), business_role_guard_1.BusinessRoleGuard),
    (0, roles_decorator_1.BusinessRoles)(),
    __metadata("design:paramtypes", [memberships_service_1.MembershipsService])
], MembershipsController);
//# sourceMappingURL=memberships.controller.js.map