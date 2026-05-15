import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateMembershipDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  membership_label?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  membership_amount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  membership_period_days?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  installment_plan?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  signup_fee?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  image?: string | null;
}
