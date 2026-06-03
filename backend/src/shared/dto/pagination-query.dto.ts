import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Query paginada estándar para listados (max 100 filas por página). */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 25;
}

/** Socios: permite pageSize hasta 500 (listado principal). */
export class MembersPaginationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  declare pageSize?: number;
}
