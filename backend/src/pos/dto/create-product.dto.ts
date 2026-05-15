import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePosProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsNumber()
  @Min(0)
  unit_price!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock_qty?: number;

  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  active?: number;
}
