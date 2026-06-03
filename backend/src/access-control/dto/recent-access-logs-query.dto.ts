import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';

export class RecentAccessLogsQueryDto extends PaginationQueryDto {
  /** @deprecated use page/pageSize */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  declare pageSize?: number;
}
