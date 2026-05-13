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
exports.TrainingAssignmentsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const business_role_guard_1 = require("../members/business-role.guard");
const roles_decorator_1 = require("../members/roles.decorator");
const create_training_assignment_dto_1 = require("./dto/create-training-assignment.dto");
const training_assignments_service_1 = require("./training-assignments.service");
let TrainingAssignmentsController = class TrainingAssignmentsController {
    constructor(assignments) {
        this.assignments = assignments;
    }
    list() {
        return this.assignments.list();
    }
    findOne(id) {
        return this.assignments.getOne(id);
    }
    create(dto, req) {
        return this.assignments.create(dto, {
            userId: req.user.userId,
            role_name: req.user.role_name,
        });
    }
    remove(id) {
        return this.assignments.remove(id);
    }
};
exports.TrainingAssignmentsController = TrainingAssignmentsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TrainingAssignmentsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TrainingAssignmentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_training_assignment_dto_1.CreateTrainingAssignmentDto, Object]),
    __metadata("design:returntype", void 0)
], TrainingAssignmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TrainingAssignmentsController.prototype, "remove", null);
exports.TrainingAssignmentsController = TrainingAssignmentsController = __decorate([
    (0, common_1.Controller)('training-assignments'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), business_role_guard_1.BusinessRoleGuard),
    (0, roles_decorator_1.BusinessRoles)(),
    __metadata("design:paramtypes", [training_assignments_service_1.TrainingAssignmentsService])
], TrainingAssignmentsController);
//# sourceMappingURL=training-assignments.controller.js.map