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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const business_role_guard_1 = require("../members/business-role.guard");
const roles_decorator_1 = require("../members/roles.decorator");
const create_product_dto_1 = require("./dto/create-product.dto");
const create_sale_dto_1 = require("./dto/create-sale.dto");
const update_product_dto_1 = require("./dto/update-product.dto");
const update_stock_dto_1 = require("./dto/update-stock.dto");
const pos_products_service_1 = require("./pos-products.service");
const pos_sales_service_1 = require("./pos-sales.service");
let PosController = class PosController {
    constructor(products, sales) {
        this.products = products;
        this.sales = sales;
    }
    catalog() {
        return this.products.listCatalog();
    }
    productsStock() {
        return this.products.listStock();
    }
    createProduct(dto) {
        return this.products.create(dto);
    }
    updateProduct(id, dto) {
        return this.products.update(id, dto);
    }
    setStock(id, dto) {
        return this.products.setStock(id, dto.stock_qty);
    }
    removeProduct(id) {
        return this.products.remove(id);
    }
    listSales(from, to) {
        return this.sales.listSales(from, to);
    }
    async exportSalesCsv(from, to, res) {
        const csv = await this.sales.exportSalesCsv(from, to);
        const safeFrom = (from ?? 'inicio').replace(/[^\d-]/g, '');
        const safeTo = (to ?? 'fin').replace(/[^\d-]/g, '');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="ventas_${safeFrom}_${safeTo}.csv"`);
        res.send(`\ufeff${csv}`);
    }
    createSale(dto, req) {
        return this.sales.createSale(dto, { userId: req.user.userId });
    }
};
exports.PosController = PosController;
__decorate([
    (0, common_1.Get)('catalog'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PosController.prototype, "catalog", null);
__decorate([
    (0, common_1.Get)('products'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PosController.prototype, "productsStock", null);
__decorate([
    (0, common_1.Post)('products'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_dto_1.CreatePosProductDto]),
    __metadata("design:returntype", void 0)
], PosController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Patch)('products/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_product_dto_1.UpdatePosProductDto]),
    __metadata("design:returntype", void 0)
], PosController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Patch)('products/:id/stock'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_stock_dto_1.UpdatePosStockDto]),
    __metadata("design:returntype", void 0)
], PosController.prototype, "setStock", null);
__decorate([
    (0, common_1.Delete)('products/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PosController.prototype, "removeProduct", null);
__decorate([
    (0, common_1.Get)('sales'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PosController.prototype, "listSales", null);
__decorate([
    (0, common_1.Get)('sales/export'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "exportSalesCsv", null);
__decorate([
    (0, common_1.Post)('sales'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_sale_dto_1.CreatePosSaleDto, Object]),
    __metadata("design:returntype", void 0)
], PosController.prototype, "createSale", null);
exports.PosController = PosController = __decorate([
    (0, common_1.Controller)('pos'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), business_role_guard_1.BusinessRoleGuard),
    (0, roles_decorator_1.BusinessRoles)(),
    __metadata("design:paramtypes", [pos_products_service_1.PosProductsService,
        pos_sales_service_1.PosSalesService])
], PosController);
//# sourceMappingURL=pos.controller.js.map