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
exports.PosSale = void 0;
const typeorm_1 = require("typeorm");
let PosSale = class PosSale {
};
exports.PosSale = PosSale;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PosSale.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double' }),
    __metadata("design:type", Number)
], PosSale.prototype, "total_amount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], PosSale.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], PosSale.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, default: 'efectivo' }),
    __metadata("design:type", String)
], PosSale.prototype, "payment_method", void 0);
exports.PosSale = PosSale = __decorate([
    (0, typeorm_1.Entity)({ name: 'pos_sale' })
], PosSale);
//# sourceMappingURL=pos-sale.entity.js.map