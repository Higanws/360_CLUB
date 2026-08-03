import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { UpsertNutritionPlanDto } from './upsert-nutrition-plan.dto';

export class UpsertNutritionGeneralDto extends UpsertNutritionPlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @Transform(
    ({ value }) =>
      value === true || value === 1 || value === '1' || value === 'true',
  )
  is_published?: boolean;
}
