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
exports.PosSaleLine = void 0;
const typeorm_1 = require("typeorm");
let PosSaleLine = class PosSaleLine {
};
exports.PosSaleLine = PosSaleLine;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PosSaleLine.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], PosSaleLine.prototype, "sale_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], PosSaleLine.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], PosSaleLine.prototype, "qty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double' }),
    __metadata("design:type", Number)
], PosSaleLine.prototype, "unit_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double' }),
    __metadata("design:type", Number)
], PosSaleLine.prototype, "line_total", void 0);
exports.PosSaleLine = PosSaleLine = __decorate([
    (0, typeorm_1.Entity)({ name: 'pos_sale_line' })
], PosSaleLine);
//# sourceMappingURL=pos-sale-line.entity.js.map