import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class TrainingRoutineLineDto {
  @IsInt()
  @Min(1)
  activity_id!: number;

  /** Peso en kg para este ejercicio en la rutina (opcional). */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) return null;
    const n =
      typeof value === 'number'
        ? value
        : Number(String(value).replace(',', '.'));
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 100) / 100;
  })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  weight_kg?: number | null;

  /**
   * Bitmask Lun–Dom (1+2+4+8+16+32+64). Entre 1 y 127; por defecto 127 (todos los días).
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) return 127;
    const n =
      typeof value === 'number'
        ? value
        : parseInt(String(value).replace(/\s/g, ''), 10);
    if (!Number.isFinite(n)) return 127;
    const masked = Math.floor(n) & 127;
    return masked < 1 ? 127 : masked;
  })
  @IsInt()
  @Min(1)
  @Max(127)
  weekdays_mask?: number;
}
