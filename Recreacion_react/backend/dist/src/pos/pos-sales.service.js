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
exports.PosSalesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const gym_member_entity_1 = require("../entities/gym-member.entity");
const pos_product_entity_1 = require("../entities/pos-product.entity");
const pos_sale_entity_1 = require("../entities/pos-sale.entity");
const pos_sale_line_entity_1 = require("../entities/pos-sale-line.entity");
function escapeCsv(s) {
    if (s.includes(';') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}
let PosSalesService = class PosSalesService {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    parseDateRange(fromStr, toStr) {
        if (!fromStr?.trim() || !toStr?.trim()) {
            throw new common_1.BadRequestException('Indica fecha desde y hasta (YYYY-MM-DD).');
        }
        const start = new Date(`${fromStr.trim()}T00:00:00.000`);
        const end = new Date(`${toStr.trim()}T23:59:59.999`);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            throw new common_1.BadRequestException('Fechas no válidas.');
        }
        if (start > end) {
            throw new common_1.BadRequestException('La fecha «desde» debe ser anterior o igual a «hasta».');
        }
        return { start, end };
    }
    async listSales(fromStr, toStr) {
        const { start, end } = this.parseDateRange(fromStr, toStr);
        const raw = await this.dataSource
            .getRepository(pos_sale_entity_1.PosSale)
            .createQueryBuilder('s')
            .select('s.id', 'id')
            .addSelect('s.total_amount', 'total_amount')
            .addSelect('s.created_at', 'created_at')
            .addSelect('s.payment_method', 'payment_method')
            .addSelect('s.created_by', 'created_by')
            .addSelect('m.username', 'seller_username')
            .leftJoin(gym_member_entity_1.GymMember, 'm', 'm.id = s.created_by')
            .where('s.created_at >= :start', { start })
            .andWhere('s.created_at <= :end', { end })
            .orderBy('s.created_at', 'DESC')
            .getRawMany();
        return raw.map((r) => ({
            id: Number(r.id),
            total_amount: Number(r.total_amount),
            created_at: r.created_at instanceof Date
                ? r.created_at.toISOString()
                : String(r.created_at),
            payment_method: String(r.payment_method ?? 'efectivo'),
            created_by: r.created_by != null ? Number(r.created_by) : null,
            seller_username: r.seller_username != null ? String(r.seller_username) : null,
        }));
    }
    async exportSalesCsv(fromStr, toStr) {
        const rows = await this.listSales(fromStr, toStr);
        const header = 'id;fecha_iso;total;metodo_pago;vendedor_user_id;vendedor_usuario';
        const lines = rows.map((r) => [
            r.id,
            r.created_at,
            String(r.total_amount).replace('.', ','),
            r.payment_method,
            r.created_by ?? '',
            escapeCsv(r.seller_username ?? ''),
        ].join(';'));
        return [header, ...lines].join('\r\n');
    }
    async createSale(dto, actor) {
        const merged = new Map();
        for (const line of dto.lines) {
            const prev = merged.get(line.product_id) ?? 0;
            merged.set(line.product_id, prev + line.qty);
        }
        const mergedLines = [...merged.entries()].map(([product_id, qty]) => ({
            product_id,
            qty,
        }));
        return this.dataSource.transaction(async (manager) => {
            const prodRepo = manager.getRepository(pos_product_entity_1.PosProduct);
            const saleRepo = manager.getRepository(pos_sale_entity_1.PosSale);
            const lineRepo = manager.getRepository(pos_sale_line_entity_1.PosSaleLine);
            let total = 0;
            const snapshots = [];
            for (const { product_id, qty } of mergedLines) {
                const product = await prodRepo.findOne({
                    where: { id: product_id, active: 1 },
                    lock: { mode: 'pessimistic_write' },
                });
                if (!product) {
                    throw new common_1.NotFoundException(`Producto ${product_id} no existe o no está a la venta.`);
                }
                if (product.stock_qty < qty) {
                    throw new common_1.BadRequestException(`Stock insuficiente para «${product.name}». Disponible: ${product.stock_qty}.`);
                }
                const unitPrice = Number(product.unit_price);
                const lineTotal = unitPrice * qty;
                total += lineTotal;
                snapshots.push({
                    product,
                    qty,
                    unit_price: unitPrice,
                    line_total: lineTotal,
                });
            }
            const sale = saleRepo.create({
                total_amount: total,
                created_by: actor.userId,
                payment_method: dto.payment_method,
            });
            await saleRepo.save(sale);
            for (const snap of snapshots) {
                snap.product.stock_qty -= snap.qty;
                await prodRepo.save(snap.product);
                const line = lineRepo.create({
                    sale_id: sale.id,
                    product_id: snap.product.id,
                    qty: snap.qty,
                    unit_price: snap.unit_price,
                    line_total: snap.line_total,
                });
                await lineRepo.save(line);
            }
            return { ok: true, sale_id: sale.id, total_amount: total };
        });
    }
};
exports.PosSalesService = PosSalesService;
exports.PosSalesService = PosSalesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], PosSalesService);
//# sourceMappingURL=pos-sales.service.js.map