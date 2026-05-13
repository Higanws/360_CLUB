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
exports.MembershipPayment = void 0;
const typeorm_1 = require("typeorm");
let MembershipPayment = class MembershipPayment {
};
exports.MembershipPayment = MembershipPayment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'mp_id' }),
    __metadata("design:type", Number)
], MembershipPayment.prototype, "mp_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], MembershipPayment.prototype, "member_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], MembershipPayment.prototype, "membership_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Object)
], MembershipPayment.prototype, "membership_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Object)
], MembershipPayment.prototype, "paid_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], MembershipPayment.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], MembershipPayment.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], MembershipPayment.prototype, "membership_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], MembershipPayment.prototype, "payment_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], MembershipPayment.prototype, "created_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], MembershipPayment.prototype, "created_by", void 0);
exports.MembershipPayment = MembershipPayment = __decorate([
    (0, typeorm_1.Entity)({ name: 'membership_payment' })
], MembershipPayment);
//# sourceMappingURL=membership-payment.entity.js.map