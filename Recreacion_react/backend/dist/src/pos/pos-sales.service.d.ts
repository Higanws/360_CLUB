import { DataSource } from 'typeorm';
import { CreatePosSaleDto } from './dto/create-sale.dto';
export type PosSaleRow = {
    id: number;
    total_amount: number;
    created_at: string;
    payment_method: string;
    created_by: number | null;
    seller_username: string | null;
};
export declare class PosSalesService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    private parseDateRange;
    listSales(fromStr: string, toStr: string): Promise<PosSaleRow[]>;
    exportSalesCsv(fromStr: string, toStr: string): Promise<string>;
    createSale(dto: CreatePosSaleDto, actor: {
        userId: number;
    }): Promise<{
        ok: true;
        sale_id: number;
        total_amount: number;
    }>;
}
