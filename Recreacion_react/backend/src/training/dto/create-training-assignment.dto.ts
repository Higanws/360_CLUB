import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';

export class CreateTrainingAssignmentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  routine_id!: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'Selecciona al menos un socio.' })
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  member_ids!: number[];

  @IsArray()
  @ArrayMinSize(1, { message: 'Selecciona al menos un entrenador.' })
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  trainer_member_ids!: number[];
}
