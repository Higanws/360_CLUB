import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { TrainingRoutineLineDto } from './training-routine-line.dto';

export class CreateTrainingRoutineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string;

  /** Actividades en orden, con peso opcional (kg) por línea. */
  @IsArray()
  @ArrayMinSize(1, { message: 'Añade al menos un ejercicio (actividad).' })
  @ValidateNested({ each: true })
  @Type(() => TrainingRoutineLineDto)
  lines!: TrainingRoutineLineDto[];

  @IsOptional()
  @Transform(
    ({ value }) =>
      value === true || value === 1 || value === '1' || value === 'true',
  )
  is_general?: boolean;
}
