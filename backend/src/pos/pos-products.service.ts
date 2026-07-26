import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PosProduct } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreatePosProductDto } from './dto/create-product.dto';
import { UpdatePosProductDto } from './dto/update-product.dto';

export type PosProductRow = {
  id: number;
  sku: string | null;
  name: string;
  unit_price: number;
  stock_qty: number;
  active: number;
  created_at: string;
};

@Injectable()
export class PosProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private row(p: PosProduct): PosProductRow {
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      unit_price: Number(p.unit_price),
      stock_qty: p.stock_qty,
      active: p.active,
      created_at:
        p.created_at instanceof Date
          ? p.created_at.toISOString()
          : String(p.created_at),
    };
  }

  /** Listado para control de stock (todos los productos). */
  async listStock(): Promise<{ products: PosProductRow[] }> {
    const rows = await this.prisma.posProduct.findMany({
      orderBy: { name: 'asc' },
    });
    return { products: rows.map((r) => this.row(r)) };
  }

  /** Catálogo para la caja: solo activos. */
  async listCatalog(): Promise<{ products: PosProductRow[] }> {
    const rows = await this.prisma.posProduct.findMany({
      where: { active: 1 },
      orderBy: { name: 'asc' },
    });
    return { products: rows.map((r) => this.row(r)) };
  }

  async create(dto: CreatePosProductDto): Promise<PosProductRow> {
    const saved = await this.prisma.posProduct.create({
      data: {
        sku: dto.sku?.trim() || null,
        name: dto.name.trim(),
        unit_price: dto.unit_price,
        stock_qty: dto.stock_qty ?? 0,
        active: dto.active ?? 1,
      },
    });
    return this.row(saved);
  }

  async update(id: number, dto: UpdatePosProductDto): Promise<PosProductRow> {
    const p = await this.prisma.posProduct.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Producto no encontrado.');

    const saved = await this.prisma.posProduct.update({
      where: { id },
      data: {
        ...(dto.sku !== undefined ? { sku: dto.sku?.trim() || null } : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.unit_price !== undefined
          ? { unit_price: dto.unit_price }
          : {}),
        ...(dto.stock_qty !== undefined ? { stock_qty: dto.stock_qty } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
    return this.row(saved);
  }

  async setStock(id: number, stock_qty: number): Promise<PosProductRow> {
    const p = await this.prisma.posProduct.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Producto no encontrado.');
    if (!Number.isInteger(stock_qty) || stock_qty < 0) {
      throw new BadRequestException('Cantidad de stock no válida.');
    }
    const saved = await this.prisma.posProduct.update({
      where: { id },
      data: { stock_qty },
    });
    return this.row(saved);
  }

  async remove(id: number): Promise<{ ok: true; deactivated?: boolean }> {
    const p = await this.prisma.posProduct.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Producto no encontrado.');

    const sold = await this.prisma.posSaleLine.count({
      where: { product_id: id },
    });
    if (sold > 0) {
      await this.prisma.posProduct.update({
        where: { id },
        data: { active: 0 },
      });
      return { ok: true, deactivated: true };
    }

    await this.prisma.posProduct.delete({ where: { id } });
    return { ok: true };
  }
}
