import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateActivityCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;
}
