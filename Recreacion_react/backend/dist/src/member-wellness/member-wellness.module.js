"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberWellnessModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const general_setting_entity_1 = require("../entities/general-setting.entity");
const gym_member_entity_1 = require("../entities/gym-member.entity");
const member_weekly_routine_entity_1 = require("../entities/member-weekly-routine.entity");
const nutrition_plan_entity_1 = require("../entities/nutrition-plan.entity");
const training_assignment_entity_1 = require("../entities/training-assignment.entity");
const member_wellness_controller_1 = require("./member-wellness.controller");
const member_wellness_service_1 = require("./member-wellness.service");
let MemberWellnessModule = class MemberWellnessModule {
};
exports.MemberWellnessModule = MemberWellnessModule;
exports.MemberWellnessModule = MemberWellnessModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                general_setting_entity_1.GeneralSetting,
                gym_member_entity_1.GymMember,
                nutrition_plan_entity_1.NutritionPlan,
                training_assignment_entity_1.TrainingAssignment,
                member_weekly_routine_entity_1.MemberWeeklyRoutine,
            ]),
        ],
        controllers: [member_wellness_controller_1.MemberWellnessController],
        providers: [member_wellness_service_1.MemberWellnessService],
    })
], MemberWellnessModule);
//# sourceMappingURL=member-wellness.module.js.map