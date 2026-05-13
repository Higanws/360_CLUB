import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ACTIVITY_DIFFICULTY_LEVELS } from '../activity-difficulty';

export class UpdateActivityDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  category_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @IsOptional()
  @IsIn([...ACTIVITY_DIFFICULTY_LEVELS])
  difficulty_level?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  video_urls?: string[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  trainer_member_ids?: number[];
}
