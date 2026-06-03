import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';

export class NutritionOverviewQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
