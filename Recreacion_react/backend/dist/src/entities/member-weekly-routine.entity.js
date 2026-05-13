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
exports.MemberWeeklyRoutine = exports.routineSnapshotLongtextTransformer = void 0;
const typeorm_1 = require("typeorm");
const gym_member_entity_1 = require("./gym-member.entity");
exports.routineSnapshotLongtextTransformer = {
    to: (v) => {
        if (v == null)
            return null;
        if (typeof v === 'string')
            return v;
        return JSON.stringify(v);
    },
    from: (v) => {
        if (v == null || v === '')
            return null;
        if (typeof v === 'object' && v !== null && !Buffer.isBuffer(v)) {
            return v;
        }
        const s = Buffer.isBuffer(v) ? v.toString('utf8') : String(v);
        const t = s.trim();
        if (!t)
            return null;
        try {
            const p = JSON.parse(t);
            return typeof p === 'object' && p !== null ? p : null;
        }
        catch {
            return null;
        }
    },
};
let MemberWeeklyRoutine = class MemberWeeklyRoutine {
};
exports.MemberWeeklyRoutine = MemberWeeklyRoutine;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MemberWeeklyRoutine.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], MemberWeeklyRoutine.prototype, "member_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gym_member_entity_1.GymMember, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'member_id' }),
    __metadata("design:type", gym_member_entity_1.GymMember)
], MemberWeeklyRoutine.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Object)
], MemberWeeklyRoutine.prototype, "week_start", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'longtext',
        nullable: true,
        transformer: exports.routineSnapshotLongtextTransformer,
    }),
    __metadata("design:type", Object)
], MemberWeeklyRoutine.prototype, "routine_snapshot_json", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime', precision: 0 }),
    __metadata("design:type", Date)
], MemberWeeklyRoutine.prototype, "updated_at", void 0);
exports.MemberWeeklyRoutine = MemberWeeklyRoutine = __decorate([
    (0, typeorm_1.Entity)({ name: 'member_weekly_routine' }),
    (0, typeorm_1.Unique)('member_weekly_routine_member_id_week_start_key', ['member_id', 'week_start'])
], MemberWeeklyRoutine);
//# sourceMappingURL=member-weekly-routine.entity.js.map