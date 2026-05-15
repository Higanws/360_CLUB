import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class ManualMembershipPaymentDto {
  @Type(() => Number)
  @IsInt()
  member_id: number;

  @Type(() => Number)
  @IsInt()
  membership_id: number;

  /** Si no se envía, se toma del plan en BD. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  membership_amount?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  paid_amount: number;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;
}
