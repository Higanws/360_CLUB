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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingAssignment = void 0;
const typeorm_1 = require("typeorm");
const training_routine_entity_1 = require("./training-routine.entity");
const training_assignment_member_entity_1 = require("./training-assignment-member.entity");
const training_assignment_trainer_entity_1 = require("./training-assignment-trainer.entity");
let TrainingAssignment = class TrainingAssignment {
};
exports.TrainingAssignment = TrainingAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TrainingAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TrainingAssignment.prototype, "routine_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => training_routine_entity_1.TrainingRoutine, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'routine_id' }),
    __metadata("design:type", training_routine_entity_1.TrainingRoutine)
], TrainingAssignment.prototype, "routine", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], TrainingAssignment.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => training_assignment_member_entity_1.TrainingAssignmentMember, (m) => m.assignment),
    __metadata("design:type", Array)
], TrainingAssignment.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => training_assignment_trainer_entity_1.TrainingAssignmentTrainer, (t) => t.assignment),
    __metadata("design:type", Array)
], TrainingAssignment.prototype, "trainers", void 0);
exports.TrainingAssignment = TrainingAssignment = __decorate([
    (0, typeorm_1.Entity)({ name: 'training_assignment' })
], TrainingAssignment);
//# sourceMappingURL=training-assignment.entity.js.map