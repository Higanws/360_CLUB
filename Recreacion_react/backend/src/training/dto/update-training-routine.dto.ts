import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { TrainingRoutineLineDto } from './training-routine-line.dto';

export class UpdateTrainingRoutineDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Añade al menos un ejercicio (actividad).' })
  @ValidateNested({ each: true })
  @Type(() => TrainingRoutineLineDto)
  lines?: TrainingRoutineLineDto[];
}
