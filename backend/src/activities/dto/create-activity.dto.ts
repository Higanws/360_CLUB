import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ACTIVITY_DIFFICULTY_LEVELS } from '../activity-difficulty';

export class CreateActivityDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  category_id!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string;

  @IsIn([...ACTIVITY_DIFFICULTY_LEVELS])
  difficulty_level!: string;

  /** Enlaces a YouTube (solo URLs; no se almacenan archivos). */
  @IsArray()
  @IsString({ each: true })
  video_urls!: string[];

  /** IDs de `gym_member` con rol entrenador (`staff_member`). */
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe asignarse al menos un entrenador.' })
  @IsInt({ each: true })
  @Min(1, { each: true })
  trainer_member_ids!: number[];
}
