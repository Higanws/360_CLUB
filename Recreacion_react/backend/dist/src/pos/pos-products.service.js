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
exports.PosProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pos_product_entity_1 = require("../entities/pos-product.entity");
const pos_sale_line_entity_1 = require("../entities/pos-sale-line.entity");
let PosProductsService = class PosProductsService {
    constructor(products, saleLines) {
        this.products = products;
        this.saleLines = saleLines;
    }
    row(p) {
        return {
            id: p.id,
            sku: p.sku,
            name: p.name,
            unit_price: Number(p.unit_price),
            stock_qty: p.stock_qty,
            active: p.active,
            created_at: p.created_at instanceof Date
                ? p.created_at.toISOString()
                : String(p.created_at),
        };
    }
    async listStock() {
        const rows = await this.products.find({ order: { name: 'ASC' } });
        return { products: rows.map((r) => this.row(r)) };
    }
    async listCatalog() {
        const rows = await this.products.find({
            where: { active: 1 },
            order: { name: 'ASC' },
        });
        return { products: rows.map((r) => this.row(r)) };
    }
    async create(dto) {
        const entity = this.products.create({
            sku: dto.sku?.trim() || null,
            name: dto.name.trim(),
            unit_price: dto.unit_price,
            stock_qty: dto.stock_qty ?? 0,
            active: dto.active ?? 1,
        });
        const saved = await this.products.save(entity);
        return this.row(saved);
    }
    async update(id, dto) {
        const p = await this.products.findOne({ where: { id } });
        if (!p)
            throw new common_1.NotFoundException('Producto no encontrado.');
        if (dto.sku !== undefined)
            p.sku = dto.sku?.trim() || null;
        if (dto.name !== undefined)
            p.name = dto.name.trim();
        if (dto.unit_price !== undefined)
            p.unit_price = dto.unit_price;
        if (dto.stock_qty !== undefined)
            p.stock_qty = dto.stock_qty;
        if (dto.active !== undefined)
            p.active = dto.active;
        const saved = await this.products.save(p);
        return this.row(saved);
    }
    async setStock(id, stock_qty) {
        const p = await this.products.findOne({ where: { id } });
        if (!p)
            throw new common_1.NotFoundException('Producto no encontrado.');
        if (!Number.isInteger(stock_qty) || stock_qty < 0) {
            throw new common_1.BadRequestException('Cantidad de stock no válida.');
        }
        p.stock_qty = stock_qty;
        const saved = await this.products.save(p);
        return this.row(saved);
    }
    async remove(id) {
        const p = await this.products.findOne({ where: { id } });
        if (!p)
            throw new common_1.NotFoundException('Producto no encontrado.');
        const sold = await this.saleLines.count({ where: { product_id: id } });
        if (sold > 0) {
            p.active = 0;
            await this.products.save(p);
            return { ok: true, deactivated: true };
        }
        await this.products.remove(p);
        return { ok: true };
    }
};
exports.PosProductsService = PosProductsService;
exports.PosProductsService = PosProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(pos_product_entity_1.PosProduct)),
    __param(1, (0, typeorm_1.InjectRepository)(pos_sale_line_entity_1.PosSaleLine)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PosProductsService);
//# sourceMappingURL=pos-products.service.js.map