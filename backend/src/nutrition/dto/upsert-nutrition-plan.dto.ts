import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Ingrediente con cantidad sugerida para el platillo. */
export class NutritionIngredientLineDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(200)
  quantity: string;
}

/** Una franja de la semana tipo: día (0=dom…6=sáb), hora 5–23, evento + detalle de platillo. */
export class NutritionScheduleSlotDto {
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number;

  @IsInt()
  @Min(5)
  @Max(23)
  hour: number;

  @IsString()
  @MaxLength(8000)
  event: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  dish?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NutritionIngredientLineDto)
  ingredients?: NutritionIngredientLineDto[] | null;
}

export class UpsertNutritionPlanDto {
  @IsOptional()
  @IsDateString()
  valid_from?: string;

  @IsOptional()
  @IsDateString()
  valid_to?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NutritionScheduleSlotDto)
  schedule_slots: NutritionScheduleSlotDto[];
}
