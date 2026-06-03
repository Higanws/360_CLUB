import { Type } from 'class-transformer';
import { IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';

export class PosSalesListQueryDto extends PaginationQueryDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to!: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  declare pageSize?: number;
}
