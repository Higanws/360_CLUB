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
exports.Membership = void 0;
const typeorm_1 = require("typeorm");
let Membership = class Membership {
};
exports.Membership = Membership;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Membership.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], Membership.prototype, "membership_label", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Object)
], Membership.prototype, "membership_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Membership.prototype, "membership_period_days", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], Membership.prototype, "installment_plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Object)
], Membership.prototype, "signup_fee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Membership.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", Object)
], Membership.prototype, "image", void 0);
exports.Membership = Membership = __decorate([
    (0, typeorm_1.Entity)({ name: 'membership' })
], Membership);
//# sourceMappingURL=membership.entity.js.map