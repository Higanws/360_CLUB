import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

export class WeeklyRoutineQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  week_start?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  member_id?: number;
}
