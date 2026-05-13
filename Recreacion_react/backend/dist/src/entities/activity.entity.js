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
exports.Activity = void 0;
const typeorm_1 = require("typeorm");
const activity_category_entity_1 = require("./activity-category.entity");
const activity_trainer_entity_1 = require("./activity-trainer.entity");
const activity_video_entity_1 = require("./activity-video.entity");
let Activity = class Activity {
};
exports.Activity = Activity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Activity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => activity_category_entity_1.ActivityCategory, (c) => c.activities, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", activity_category_entity_1.ActivityCategory)
], Activity.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], Activity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Activity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'media' }),
    __metadata("design:type", String)
], Activity.prototype, "difficulty_level", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], Activity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => activity_video_entity_1.ActivityVideo, (v) => v.activity),
    __metadata("design:type", Array)
], Activity.prototype, "videos", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => activity_trainer_entity_1.ActivityTrainer, (t) => t.activity),
    __metadata("design:type", Array)
], Activity.prototype, "trainers", void 0);
exports.Activity = Activity = __decorate([
    (0, typeorm_1.Entity)({ name: 'activity' })
], Activity);
//# sourceMappingURL=activity.entity.js.map