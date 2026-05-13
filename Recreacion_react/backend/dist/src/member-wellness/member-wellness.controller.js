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
exports.MemberWellnessController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const member_preview_query_dto_1 = require("./dto/member-preview-query.dto");
const patch_weekly_routine_dto_1 = require("./dto/patch-weekly-routine.dto");
const weekly_routine_query_dto_1 = require("./dto/weekly-routine-query.dto");
const member_wellness_service_1 = require("./member-wellness.service");
let MemberWellnessController = class MemberWellnessController {
    constructor(wellness) {
        this.wellness = wellness;
    }
    myNutritionPlan(req, q) {
        return this.wellness.getMyNutritionPlan(req.user, q.member_id);
    }
    myTrainingContext(req, q) {
        return this.wellness.getMyTrainingContext(req.user, q.member_id);
    }
    getWeeklyRoutine(req, q) {
        return this.wellness.getWeeklyRoutine(req.user, q.week_start, q.member_id);
    }
    patchWeeklyRoutine(req, dto) {
        return this.wellness.patchWeeklyRoutine(req.user, dto);
    }
};
exports.MemberWellnessController = MemberWellnessController;
__decorate([
    (0, common_1.Get)('my-nutrition-plan'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, member_preview_query_dto_1.MemberPreviewQueryDto]),
    __metadata("design:returntype", void 0)
], MemberWellnessController.prototype, "myNutritionPlan", null);
__decorate([
    (0, common_1.Get)('my-training-context'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, member_preview_query_dto_1.MemberPreviewQueryDto]),
    __metadata("design:returntype", void 0)
], MemberWellnessController.prototype, "myTrainingContext", null);
__decorate([
    (0, common_1.Get)('weekly-routine'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, weekly_routine_query_dto_1.WeeklyRoutineQueryDto]),
    __metadata("design:returntype", void 0)
], MemberWellnessController.prototype, "getWeeklyRoutine", null);
__decorate([
    (0, common_1.Patch)('weekly-routine'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, patch_weekly_routine_dto_1.PatchWeeklyRoutineDto]),
    __metadata("design:returntype", void 0)
], MemberWellnessController.prototype, "patchWeeklyRoutine", null);
exports.MemberWellnessController = MemberWellnessController = __decorate([
    (0, common_1.Controller)('member-wellness'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [member_wellness_service_1.MemberWellnessService])
], MemberWellnessController);
//# sourceMappingURL=member-wellness.controller.js.map