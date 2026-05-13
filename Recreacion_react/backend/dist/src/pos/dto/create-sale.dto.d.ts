export declare class PosSaleLineInputDto {
    product_id: number;
    qty: number;
}
export declare class CreatePosSaleDto {
    payment_method: string;
    lines: PosSaleLineInputDto[];
}
