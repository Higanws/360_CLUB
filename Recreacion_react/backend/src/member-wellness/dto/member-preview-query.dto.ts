import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

/** Query opcional para que administración/staff consulten datos de un socio concreto. */
export class MemberPreviewQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  member_id?: number;
}
