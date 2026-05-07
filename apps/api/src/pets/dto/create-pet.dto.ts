import { IsString, IsEnum, IsOptional, IsISO8601 } from 'class-validator';

export class CreatePetDto {
  @IsString()
  name: string;

  @IsEnum(['dog', 'cat', 'bird', 'rabbit', 'other'])
  species: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsISO8601()
  birthDate?: string;

  @IsEnum(['male', 'female', 'MALE', 'FEMALE'])
  sex: string;
}
