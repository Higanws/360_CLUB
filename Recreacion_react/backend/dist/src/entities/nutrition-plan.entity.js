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
exports.NutritionPlan = void 0;
const typeorm_1 = require("typeorm");
const gym_member_entity_1 = require("./gym-member.entity");
const schedule_json_util_1 = require("../nutrition/schedule-json.util");
let NutritionPlan = class NutritionPlan {
};
exports.NutritionPlan = NutritionPlan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], NutritionPlan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', unique: true }),
    __metadata("design:type", Number)
], NutritionPlan.prototype, "member_id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => gym_member_entity_1.GymMember, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'member_id' }),
    __metadata("design:type", gym_member_entity_1.GymMember)
], NutritionPlan.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], NutritionPlan.prototype, "valid_from", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], NutritionPlan.prototype, "valid_to", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'longtext',
        nullable: true,
        transformer: schedule_json_util_1.mealsScheduleLongtextTransformer,
    }),
    __metadata("design:type", Object)
], NutritionPlan.prototype, "meals_schedule_json", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], NutritionPlan.prototype, "created_at", void 0);
exports.NutritionPlan = NutritionPlan = __decorate([
    (0, typeorm_1.Entity)({ name: 'nutrition_plan' })
], NutritionPlan);
//# sourceMappingURL=nutrition-plan.entity.js.map