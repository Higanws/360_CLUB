import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class TestDbDto {
  @IsString()
  @IsNotEmpty()
  host: string;

  /** Acepta número o string desde JSON. */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  password: string;

  @IsString()
  @IsNotEmpty()
  database: string;
}

export class RunInstallDto extends TestDbDto {
  @IsString()
  @MinLength(2)
  adminUsername: string;

  @IsString()
  @MinLength(3)
  adminPassword: string;
}
