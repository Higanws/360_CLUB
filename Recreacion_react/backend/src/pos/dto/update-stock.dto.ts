import { IsInt, Min } from 'class-validator';

export class UpdatePosStockDto {
  @IsInt()
  @Min(0)
  stock_qty!: number;
}
