import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMembershipDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  membership_label!: string;

  @IsNumber()
  @Min(0)
  membership_amount!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  membership_period_days?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  installment_plan?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  signup_fee?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  image?: string;
}
