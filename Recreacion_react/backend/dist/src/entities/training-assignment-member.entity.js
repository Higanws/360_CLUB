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
exports.TrainingAssignmentMember = void 0;
const typeorm_1 = require("typeorm");
const gym_member_entity_1 = require("./gym-member.entity");
const training_assignment_entity_1 = require("./training-assignment.entity");
let TrainingAssignmentMember = class TrainingAssignmentMember {
};
exports.TrainingAssignmentMember = TrainingAssignmentMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TrainingAssignmentMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TrainingAssignmentMember.prototype, "assignment_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TrainingAssignmentMember.prototype, "member_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => training_assignment_entity_1.TrainingAssignment, (a) => a.members, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'assignment_id' }),
    __metadata("design:type", training_assignment_entity_1.TrainingAssignment)
], TrainingAssignmentMember.prototype, "assignment", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gym_member_entity_1.GymMember, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'member_id' }),
    __metadata("design:type", gym_member_entity_1.GymMember)
], TrainingAssignmentMember.prototype, "member", void 0);
exports.TrainingAssignmentMember = TrainingAssignmentMember = __decorate([
    (0, typeorm_1.Entity)({ name: 'training_assignment_member' }),
    (0, typeorm_1.Unique)('uk_training_assignment_member', ['assignment_id', 'member_id'])
], TrainingAssignmentMember);
//# sourceMappingURL=training-assignment-member.entity.js.map