"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const pos_product_entity_1 = require("../entities/pos-product.entity");
const pos_sale_entity_1 = require("../entities/pos-sale.entity");
const pos_sale_line_entity_1 = require("../entities/pos-sale-line.entity");
const pos_controller_1 = require("./pos.controller");
const pos_products_service_1 = require("./pos-products.service");
const pos_sales_service_1 = require("./pos-sales.service");
let PosModule = class PosModule {
};
exports.PosModule = PosModule;
exports.PosModule = PosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([pos_product_entity_1.PosProduct, pos_sale_entity_1.PosSale, pos_sale_line_entity_1.PosSaleLine]),
        ],
        controllers: [pos_controller_1.PosController],
        providers: [pos_products_service_1.PosProductsService, pos_sales_service_1.PosSalesService],
    })
], PosModule);
//# sourceMappingURL=pos.module.js.map