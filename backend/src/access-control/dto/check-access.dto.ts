import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CheckAccessDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  lookup!: string;

  /** Si false, solo consulta estado (no escribe en `club_access_log`). */
  @IsOptional()
  record?: boolean;
}
