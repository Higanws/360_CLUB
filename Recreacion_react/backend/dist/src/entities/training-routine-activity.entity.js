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
exports.TrainingRoutineActivity = void 0;
const typeorm_1 = require("typeorm");
const activity_entity_1 = require("./activity.entity");
const training_routine_entity_1 = require("./training-routine.entity");
let TrainingRoutineActivity = class TrainingRoutineActivity {
};
exports.TrainingRoutineActivity = TrainingRoutineActivity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TrainingRoutineActivity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TrainingRoutineActivity.prototype, "routine_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TrainingRoutineActivity.prototype, "activity_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TrainingRoutineActivity.prototype, "sort_order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double', nullable: true }),
    __metadata("design:type", Object)
], TrainingRoutineActivity.prototype, "weight_kg", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', unsigned: true, default: 127 }),
    __metadata("design:type", Number)
], TrainingRoutineActivity.prototype, "weekdays_mask", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => training_routine_entity_1.TrainingRoutine, (r) => r.lines, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'routine_id' }),
    __metadata("design:type", training_routine_entity_1.TrainingRoutine)
], TrainingRoutineActivity.prototype, "routine", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => activity_entity_1.Activity, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'activity_id' }),
    __metadata("design:type", activity_entity_1.Activity)
], TrainingRoutineActivity.prototype, "activity", void 0);
exports.TrainingRoutineActivity = TrainingRoutineActivity = __decorate([
    (0, typeorm_1.Entity)({ name: 'training_routine_activity' }),
    (0, typeorm_1.Unique)('uk_training_routine_activity', ['routine_id', 'activity_id'])
], TrainingRoutineActivity);
//# sourceMappingURL=training-routine-activity.entity.js.map