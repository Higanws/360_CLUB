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
exports.PosProduct = void 0;
const typeorm_1 = require("typeorm");
let PosProduct = class PosProduct {
};
exports.PosProduct = PosProduct;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PosProduct.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], PosProduct.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], PosProduct.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double', default: 0 }),
    __metadata("design:type", Number)
], PosProduct.prototype, "unit_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PosProduct.prototype, "stock_qty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 1 }),
    __metadata("design:type", Number)
], PosProduct.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], PosProduct.prototype, "created_at", void 0);
exports.PosProduct = PosProduct = __decorate([
    (0, typeorm_1.Entity)({ name: 'pos_product' })
], PosProduct);
//# sourceMappingURL=pos-product.entity.js.map