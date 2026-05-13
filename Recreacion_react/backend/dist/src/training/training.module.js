"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const activity_entity_1 = require("../entities/activity.entity");
const gym_member_entity_1 = require("../entities/gym-member.entity");
const training_assignment_entity_1 = require("../entities/training-assignment.entity");
const training_assignment_member_entity_1 = require("../entities/training-assignment-member.entity");
const training_assignment_trainer_entity_1 = require("../entities/training-assignment-trainer.entity");
const training_routine_entity_1 = require("../entities/training-routine.entity");
const training_routine_activity_entity_1 = require("../entities/training-routine-activity.entity");
const training_assignments_controller_1 = require("./training-assignments.controller");
const training_assignments_service_1 = require("./training-assignments.service");
const training_routines_controller_1 = require("./training-routines.controller");
const training_routines_service_1 = require("./training-routines.service");
let TrainingModule = class TrainingModule {
};
exports.TrainingModule = TrainingModule;
exports.TrainingModule = TrainingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                training_routine_entity_1.TrainingRoutine,
                training_routine_activity_entity_1.TrainingRoutineActivity,
                activity_entity_1.Activity,
                training_assignment_entity_1.TrainingAssignment,
                training_assignment_member_entity_1.TrainingAssignmentMember,
                training_assignment_trainer_entity_1.TrainingAssignmentTrainer,
                gym_member_entity_1.GymMember,
            ]),
        ],
        controllers: [training_routines_controller_1.TrainingRoutinesController, training_assignments_controller_1.TrainingAssignmentsController],
        providers: [training_routines_service_1.TrainingRoutinesService, training_assignments_service_1.TrainingAssignmentsService],
    })
], TrainingModule);
//# sourceMappingURL=training.module.js.map