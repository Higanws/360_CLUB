import { Type } from 'class-transformer';
import { IsInt, IsObject, IsOptional, IsString, Matches, Min } from 'class-validator';

export class PatchWeeklyRoutineDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  week_start!: string;

  @IsObject()
  routine_snapshot_json!: Record<string, unknown>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  member_id?: number;
}
