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
exports.TrainingRoutinesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const business_role_guard_1 = require("../members/business-role.guard");
const roles_decorator_1 = require("../members/roles.decorator");
const create_training_routine_dto_1 = require("./dto/create-training-routine.dto");
const update_training_routine_dto_1 = require("./dto/update-training-routine.dto");
const training_routines_service_1 = require("./training-routines.service");
let TrainingRoutinesController = class TrainingRoutinesController {
    constructor(routines) {
        this.routines = routines;
    }
    list() {
        return this.routines.list();
    }
    findOne(id) {
        return this.routines.getOne(id);
    }
    create(dto) {
        return this.routines.create(dto);
    }
    update(id, dto) {
        return this.routines.update(id, dto);
    }
    remove(id) {
        return this.routines.remove(id);
    }
};
exports.TrainingRoutinesController = TrainingRoutinesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TrainingRoutinesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TrainingRoutinesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_training_routine_dto_1.CreateTrainingRoutineDto]),
    __metadata("design:returntype", void 0)
], TrainingRoutinesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_training_routine_dto_1.UpdateTrainingRoutineDto]),
    __metadata("design:returntype", void 0)
], TrainingRoutinesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TrainingRoutinesController.prototype, "remove", null);
exports.TrainingRoutinesController = TrainingRoutinesController = __decorate([
    (0, common_1.Controller)('training-routines'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), business_role_guard_1.BusinessRoleGuard),
    (0, roles_decorator_1.BusinessRoles)(),
    __metadata("design:paramtypes", [training_routines_service_1.TrainingRoutinesService])
], TrainingRoutinesController);
//# sourceMappingURL=training-routines.controller.js.map