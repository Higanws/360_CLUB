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
exports.ClubAccessLog = void 0;
const typeorm_1 = require("typeorm");
const gym_member_entity_1 = require("./gym-member.entity");
let ClubAccessLog = class ClubAccessLog {
};
exports.ClubAccessLog = ClubAccessLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ClubAccessLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], ClubAccessLog.prototype, "member_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], ClubAccessLog.prototype, "access_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], ClubAccessLog.prototype, "access_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ClubAccessLog.prototype, "staff_actor_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40 }),
    __metadata("design:type", String)
], ClubAccessLog.prototype, "outcome", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, nullable: true }),
    __metadata("design:type", Object)
], ClubAccessLog.prototype, "status_display", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 160, nullable: true }),
    __metadata("design:type", Object)
], ClubAccessLog.prototype, "lookup_raw", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], ClubAccessLog.prototype, "due_date_snapshot", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], ClubAccessLog.prototype, "days_remaining", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], ClubAccessLog.prototype, "days_overdue", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gym_member_entity_1.GymMember, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'member_id' }),
    __metadata("design:type", Object)
], ClubAccessLog.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gym_member_entity_1.GymMember, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'staff_actor_id' }),
    __metadata("design:type", gym_member_entity_1.GymMember)
], ClubAccessLog.prototype, "staffActor", void 0);
exports.ClubAccessLog = ClubAccessLog = __decorate([
    (0, typeorm_1.Entity)({ name: 'club_access_log' })
], ClubAccessLog);
//# sourceMappingURL=club-access-log.entity.js.map