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
exports.MembersController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const business_role_guard_1 = require("./business-role.guard");
const create_member_dto_1 = require("./dto/create-member.dto");
const update_member_dto_1 = require("./dto/update-member.dto");
const members_service_1 = require("./members.service");
const roles_decorator_1 = require("./roles.decorator");
let MembersController = class MembersController {
    constructor(members) {
        this.members = members;
    }
    formOptions() {
        return this.members.formOptions();
    }
    list(req) {
        return this.members.listForUser({
            userId: req.user.userId,
            role_name: req.user.role_name,
        });
    }
    create(dto, req) {
        return this.members.create(dto, {
            userId: req.user.userId,
            role_name: req.user.role_name,
        });
    }
    findOne(id, req) {
        return this.members.findOne(id, {
            userId: req.user.userId,
            role_name: req.user.role_name,
        });
    }
    update(id, dto, req) {
        return this.members.update(id, dto, {
            userId: req.user.userId,
            role_name: req.user.role_name,
        });
    }
    remove(id, req) {
        return this.members.remove(id, {
            userId: req.user.userId,
            role_name: req.user.role_name,
        });
    }
};
exports.MembersController = MembersController;
__decorate([
    (0, common_1.Get)('form-options'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "formOptions", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_member_dto_1.CreateMemberDto, Object]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_member_dto_1.UpdateMemberDto, Object]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "remove", null);
exports.MembersController = MembersController = __decorate([
    (0, common_1.Controller)('members'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), business_role_guard_1.BusinessRoleGuard),
    (0, roles_decorator_1.BusinessRoles)(),
    __metadata("design:paramtypes", [members_service_1.MembersService])
], MembersController);
//# sourceMappingURL=members.controller.js.map