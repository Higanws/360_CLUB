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

/** Una franja de la semana tipo: día (0=dom…6=sáb), hora 5–23, texto del evento. */
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
