import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GymMember } from '../entities/gym-member.entity';
import { PosProduct } from '../entities/pos-product.entity';
import { PosSale } from '../entities/pos-sale.entity';
import { PosSaleLine } from '../entities/pos-sale-line.entity';
import { CreatePosSaleDto } from './dto/create-sale.dto';
import {
  buildPageMeta,
  paginationSkip,
  type PaginatedMeta,
} from '../shared/dto/paginated-meta';
import { DashboardCacheService } from '../shared/cache/dashboard-cache.service';

const MAX_SALES_RANGE_DAYS = 90;

function escapeCsv(s: string): string {
  if (s.includes(';') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export type PosSaleRow = {
  id: number;
  total_amount: number;
  created_at: string;
  payment_method: string;
  created_by: number | null;
  seller_username: string | null;
};

@Injectable()
export class PosSalesService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly dashboardCache: DashboardCacheService,
  ) {}

  private parseDateRange(fromStr: string, toStr: string): { start: Date; end: Date } {
    if (!fromStr?.trim() || !toStr?.trim()) {
      throw new BadRequestException('Indica fecha desde y hasta (YYYY-MM-DD).');
    }
    const start = new Date(`${fromStr.trim()}T00:00:00.000`);
    const end = new Date(`${toStr.trim()}T23:59:59.999`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Fechas no válidas.');
    }
    if (start > end) {
      throw new BadRequestException(
        'La fecha «desde» debe ser anterior o igual a «hasta».',
      );
    }
    const spanDays =
      (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
    if (spanDays > MAX_SALES_RANGE_DAYS) {
      throw new BadRequestException(
        `El rango no puede superar ${MAX_SALES_RANGE_DAYS} días.`,
      );
    }
    return { start, end };
  }

  private salesQueryBuilder(start: Date, end: Date) {
    return this.dataSource
      .getRepository(PosSale)
      .createQueryBuilder('s')
      .select('s.id', 'id')
      .addSelect('s.total_amount', 'total_amount')
      .addSelect('s.created_at', 'created_at')
      .addSelect('s.payment_method', 'payment_method')
      .addSelect('s.created_by', 'created_by')
      .addSelect('m.username', 'seller_username')
      .leftJoin(GymMember, 'm', 'm.id = s.created_by')
      .where('s.created_at >= :start', { start })
      .andWhere('s.created_at <= :end', { end })
      .orderBy('s.created_at', 'DESC');
  }

  private mapSaleRows(
    raw: Array<Record<string, unknown>>,
  ): PosSaleRow[] {
    return raw.map((r) => ({
      id: Number(r.id),
      total_amount: Number(r.total_amount),
      created_at:
        r.created_at instanceof Date
          ? r.created_at.toISOString()
          : String(r.created_at),
      payment_method: String(r.payment_method ?? 'efectivo'),
      created_by: r.created_by != null ? Number(r.created_by) : null,
      seller_username:
        r.seller_username != null ? String(r.seller_username) : null,
    }));
  }

  async listSales(
    fromStr: string,
    toStr: string,
    page = 1,
    pageSize = 25,
  ): Promise<{ sales: PosSaleRow[]; meta: PaginatedMeta }> {
    const { start, end } = this.parseDateRange(fromStr, toStr);
    const ps = Math.min(100, Math.max(1, pageSize));
    const pg = Math.max(1, page);
    const base = this.salesQueryBuilder(start, end);
    const total = await base.clone().getCount();
    const raw = await base
      .offset(paginationSkip(pg, ps))
      .limit(ps)
      .getRawMany();
    return {
      sales: this.mapSaleRows(raw),
      meta: buildPageMeta(total, pg, ps),
    };
  }

  /** Compat: export CSV usa listado completo del rango (máx. 90 días). */
  async listSalesAll(fromStr: string, toStr: string): Promise<PosSaleRow[]> {
    const { start, end } = this.parseDateRange(fromStr, toStr);
    const raw = await this.salesQueryBuilder(start, end).getRawMany();
    return this.mapSaleRows(raw);
  }

  /** CSV con cabecera UTF-8 (BOM añadida en el controlador). */
  async exportSalesCsv(fromStr: string, toStr: string): Promise<string> {
    const rows = await this.listSalesAll(fromStr, toStr);
    const header =
      'id;fecha_iso;total;metodo_pago;vendedor_user_id;vendedor_usuario';
    const lines = rows.map((r) =>
      [
        r.id,
        r.created_at,
        String(r.total_amount).replace('.', ','),
        r.payment_method,
        r.created_by ?? '',
        escapeCsv(r.seller_username ?? ''),
      ].join(';'),
    );
    return [header, ...lines].join('\r\n');
  }

  async createSale(
    dto: CreatePosSaleDto,
    actor: { userId: number },
  ): Promise<{ ok: true; sale_id: number; total_amount: number }> {
    const merged = new Map<number, number>();
    for (const line of dto.lines) {
      const prev = merged.get(line.product_id) ?? 0;
      merged.set(line.product_id, prev + line.qty);
    }

    const mergedLines = [...merged.entries()].map(([product_id, qty]) => ({
      product_id,
      qty,
    }));

    const result = await this.dataSource.transaction(async (manager) => {
      const prodRepo = manager.getRepository(PosProduct);
      const saleRepo = manager.getRepository(PosSale);
      const lineRepo = manager.getRepository(PosSaleLine);

      let total = 0;
      const snapshots: Array<{
        product: PosProduct;
        qty: number;
        unit_price: number;
        line_total: number;
      }> = [];

      for (const { product_id, qty } of mergedLines) {
        const product = await prodRepo.findOne({
          where: { id: product_id, active: 1 },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product) {
          throw new NotFoundException(
            `Producto ${product_id} no existe o no está a la venta.`,
          );
        }
        if (product.stock_qty < qty) {
          throw new BadRequestException(
            `Stock insuficiente para «${product.name}». Disponible: ${product.stock_qty}.`,
          );
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

      return { ok: true as const, sale_id: sale.id, total_amount: total };
    });
    await this.dashboardCache.invalidateBusinessMetrics();
    return result;
  }
}
