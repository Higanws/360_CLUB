import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';

export class TrainingAssignmentsListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  memberId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trainerId?: number;
}
