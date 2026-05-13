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
export declare class PosProductsService {
    private readonly products;
    private readonly saleLines;
    constructor(products: Repository<PosProduct>, saleLines: Repository<PosSaleLine>);
    private row;
    listStock(): Promise<{
        products: PosProductRow[];
    }>;
    listCatalog(): Promise<{
        products: PosProductRow[];
    }>;
    create(dto: CreatePosProductDto): Promise<PosProductRow>;
    update(id: number, dto: UpdatePosProductDto): Promise<PosProductRow>;
    setStock(id: number, stock_qty: number): Promise<PosProductRow>;
    remove(id: number): Promise<{
        ok: true;
        deactivated?: boolean;
    }>;
}
