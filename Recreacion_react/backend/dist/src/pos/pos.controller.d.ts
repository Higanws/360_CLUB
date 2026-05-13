import type { Response } from 'express';
import { CreatePosProductDto } from './dto/create-product.dto';
import { CreatePosSaleDto } from './dto/create-sale.dto';
import { UpdatePosProductDto } from './dto/update-product.dto';
import { UpdatePosStockDto } from './dto/update-stock.dto';
import { PosProductsService } from './pos-products.service';
import { PosSalesService } from './pos-sales.service';
export declare class PosController {
    private readonly products;
    private readonly sales;
    constructor(products: PosProductsService, sales: PosSalesService);
    catalog(): Promise<{
        products: import("./pos-products.service").PosProductRow[];
    }>;
    productsStock(): Promise<{
        products: import("./pos-products.service").PosProductRow[];
    }>;
    createProduct(dto: CreatePosProductDto): Promise<import("./pos-products.service").PosProductRow>;
    updateProduct(id: number, dto: UpdatePosProductDto): Promise<import("./pos-products.service").PosProductRow>;
    setStock(id: number, dto: UpdatePosStockDto): Promise<import("./pos-products.service").PosProductRow>;
    removeProduct(id: number): Promise<{
        ok: true;
        deactivated?: boolean;
    }>;
    listSales(from: string, to: string): Promise<import("./pos-sales.service").PosSaleRow[]>;
    exportSalesCsv(from: string, to: string, res: Response): Promise<void>;
    createSale(dto: CreatePosSaleDto, req: {
        user: {
            userId: number;
        };
    }): Promise<{
        ok: true;
        sale_id: number;
        total_amount: number;
    }>;
}
