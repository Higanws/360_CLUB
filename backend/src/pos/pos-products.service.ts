import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PosProduct } from '../entities/pos-product.entity';
import { PosSaleLine } from '../entities/pos-sale-line.entity';
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
  constructor(
    @InjectRepository(PosProduct)
    private readonly products: Repository<PosProduct>,
    @InjectRepository(PosSaleLine)
    private readonly saleLines: Repository<PosSaleLine>,
  ) {}

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
    const rows = await this.products.find({ order: { name: 'ASC' } });
    return { products: rows.map((r) => this.row(r)) };
  }

  /** Catálogo para la caja: solo activos. */
  async listCatalog(): Promise<{ products: PosProductRow[] }> {
    const rows = await this.products.find({
      where: { active: 1 },
      order: { name: 'ASC' },
    });
    return { products: rows.map((r) => this.row(r)) };
  }

  async create(dto: CreatePosProductDto): Promise<PosProductRow> {
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

  async update(id: number, dto: UpdatePosProductDto): Promise<PosProductRow> {
    const p = await this.products.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Producto no encontrado.');

    if (dto.sku !== undefined) p.sku = dto.sku?.trim() || null;
    if (dto.name !== undefined) p.name = dto.name.trim();
    if (dto.unit_price !== undefined) p.unit_price = dto.unit_price;
    if (dto.stock_qty !== undefined) p.stock_qty = dto.stock_qty;
    if (dto.active !== undefined) p.active = dto.active;

    const saved = await this.products.save(p);
    return this.row(saved);
  }

  async setStock(id: number, stock_qty: number): Promise<PosProductRow> {
    const p = await this.products.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Producto no encontrado.');
    if (!Number.isInteger(stock_qty) || stock_qty < 0) {
      throw new BadRequestException('Cantidad de stock no válida.');
    }
    p.stock_qty = stock_qty;
    const saved = await this.products.save(p);
    return this.row(saved);
  }

  async remove(id: number): Promise<{ ok: true; deactivated?: boolean }> {
    const p = await this.products.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Producto no encontrado.');

    const sold = await this.saleLines.count({ where: { product_id: id } });
    if (sold > 0) {
      p.active = 0;
      await this.products.save(p);
      return { ok: true, deactivated: true };
    }

    await this.products.remove(p);
    return { ok: true };
  }
}
