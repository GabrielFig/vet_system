import { IsOptional, IsString, IsEnum, IsISO8601, IsNumber, Min } from 'class-validator';

export class UpdatePetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['dog', 'cat', 'bird', 'rabbit', 'other'])
  species?: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsISO8601()
  birthDate?: string;

  @IsOptional()
  @IsEnum(['male', 'female', 'MALE', 'FEMALE'])
  sex?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;
}
