import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { POS_PAYMENT_METHODS } from '../payment-method';

export class PosSaleLineInputDto {
  @IsInt()
  @Min(1)
  product_id!: number;

  @IsInt()
  @Min(1)
  qty!: number;
}

export class CreatePosSaleDto {
  @IsIn([...POS_PAYMENT_METHODS])
  payment_method!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PosSaleLineInputDto)
  lines!: PosSaleLineInputDto[];
}
