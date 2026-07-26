import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
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

type SaleRawRow = {
  id: number | bigint;
  total_amount: number | string;
  created_at: Date | string;
  payment_method: string | null;
  created_by: number | bigint | null;
  seller_username: string | null;
};

type LockedProductRow = {
  id: number;
  name: string;
  unit_price: number | string;
  stock_qty: number;
};

@Injectable()
export class PosSalesService {
  constructor(
    private readonly prisma: PrismaService,
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

  private mapSaleRows(raw: SaleRawRow[]): PosSaleRow[] {
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

  private async querySales(
    start: Date,
    end: Date,
    limit?: number,
    offset?: number,
  ): Promise<SaleRawRow[]> {
    return this.prisma.$queryRaw<SaleRawRow[]>`
      SELECT s.id AS id,
        s.total_amount AS total_amount,
        s.created_at AS created_at,
        s.payment_method AS payment_method,
        s.created_by AS created_by,
        m.username AS seller_username
      FROM pos_sale s
      LEFT JOIN gym_member m ON m.id = s.created_by
      WHERE s.created_at >= ${start} AND s.created_at <= ${end}
      ORDER BY s.created_at DESC
      ${limit != null ? Prisma.sql`LIMIT ${limit} OFFSET ${offset ?? 0}` : Prisma.empty}
    `;
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

    const [totalRows, raw] = await Promise.all([
      this.prisma.posSale.count({
        where: { created_at: { gte: start, lte: end } },
      }),
      this.querySales(start, end, ps, paginationSkip(pg, ps)),
    ]);

    return {
      sales: this.mapSaleRows(raw),
      meta: buildPageMeta(totalRows, pg, ps),
    };
  }

  /** Compat: export CSV usa listado completo del rango (máx. 90 días). */
  async listSalesAll(fromStr: string, toStr: string): Promise<PosSaleRow[]> {
    const { start, end } = this.parseDateRange(fromStr, toStr);
    const raw = await this.querySales(start, end);
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

    const result = await this.prisma.$transaction(async (tx) => {
      let total = 0;
      const snapshots: Array<{
        product_id: number;
        name: string;
        qty: number;
        unit_price: number;
        line_total: number;
      }> = [];

      for (const { product_id, qty } of mergedLines) {
        const rows = await tx.$queryRaw<LockedProductRow[]>`
          SELECT id, name, unit_price, stock_qty
          FROM pos_product
          WHERE id = ${product_id} AND active = 1
          FOR UPDATE
        `;
        const product = rows[0];
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
          product_id: product.id,
          name: product.name,
          qty,
          unit_price: unitPrice,
          line_total: lineTotal,
        });
      }

      const sale = await tx.posSale.create({
        data: {
          total_amount: total,
          created_by: actor.userId,
          payment_method: dto.payment_method,
        },
      });

      for (const snap of snapshots) {
        await tx.posProduct.update({
          where: { id: snap.product_id },
          data: { stock_qty: { decrement: snap.qty } },
        });
        await tx.posSaleLine.create({
          data: {
            sale_id: sale.id,
            product_id: snap.product_id,
            qty: snap.qty,
            unit_price: snap.unit_price,
            line_total: snap.line_total,
          },
        });
      }

      return { ok: true as const, sale_id: sale.id, total_amount: total };
    });
    await this.dashboardCache.invalidateBusinessMetrics();
    return result;
  }
}
