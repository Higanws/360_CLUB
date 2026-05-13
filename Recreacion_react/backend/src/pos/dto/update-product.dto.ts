import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdatePosProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unit_price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock_qty?: number;

  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  active?: number;
}
