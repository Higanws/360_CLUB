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
exports.ActivityTrainer = void 0;
const typeorm_1 = require("typeorm");
const activity_entity_1 = require("./activity.entity");
const gym_member_entity_1 = require("./gym-member.entity");
let ActivityTrainer = class ActivityTrainer {
};
exports.ActivityTrainer = ActivityTrainer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ActivityTrainer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ActivityTrainer.prototype, "activity_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ActivityTrainer.prototype, "trainer_member_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => activity_entity_1.Activity, (a) => a.trainers, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'activity_id' }),
    __metadata("design:type", activity_entity_1.Activity)
], ActivityTrainer.prototype, "activity", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gym_member_entity_1.GymMember, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'trainer_member_id' }),
    __metadata("design:type", gym_member_entity_1.GymMember)
], ActivityTrainer.prototype, "member", void 0);
exports.ActivityTrainer = ActivityTrainer = __decorate([
    (0, typeorm_1.Entity)({ name: 'activity_trainer' })
], ActivityTrainer);
//# sourceMappingURL=activity-trainer.entity.js.map