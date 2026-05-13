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
exports.StaffController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const business_role_guard_1 = require("../members/business-role.guard");
const roles_decorator_1 = require("../members/roles.decorator");
const administrator_role_guard_1 = require("./administrator-role.guard");
const create_staff_dto_1 = require("./dto/create-staff.dto");
const update_staff_dto_1 = require("./dto/update-staff.dto");
const staff_service_1 = require("./staff.service");
let StaffController = class StaffController {
    constructor(staff) {
        this.staff = staff;
    }
    formOptions() {
        return this.staff.formOptions();
    }
    list(req) {
        return this.staff.listForUser({
            userId: req.user.userId,
            role_name: req.user.role_name,
        });
    }
    create(dto) {
        return this.staff.create(dto);
    }
    findOne(id, req) {
        return this.staff.findOne(id, {
            userId: req.user.userId,
            role_name: req.user.role_name,
        });
    }
    update(id, dto, req) {
        return this.staff.update(id, dto, {
            userId: req.user.userId,
            role_name: req.user.role_name,
        });
    }
    remove(id) {
        return this.staff.remove(id);
    }
};
exports.StaffController = StaffController;
__decorate([
    (0, common_1.Get)('form-options'),
    (0, common_1.UseGuards)(administrator_role_guard_1.AdministratorRoleGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "formOptions", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(administrator_role_guard_1.AdministratorRoleGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_staff_dto_1.CreateStaffDto]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(administrator_role_guard_1.AdministratorRoleGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_staff_dto_1.UpdateStaffDto, Object]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(administrator_role_guard_1.AdministratorRoleGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "remove", null);
exports.StaffController = StaffController = __decorate([
    (0, common_1.Controller)('staff'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), business_role_guard_1.BusinessRoleGuard),
    (0, roles_decorator_1.BusinessRoles)(),
    __metadata("design:paramtypes", [staff_service_1.StaffService])
], StaffController);
//# sourceMappingURL=staff.controller.js.map