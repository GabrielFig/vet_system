import { IsString, IsEnum, IsOptional, IsISO8601, IsUUID, IsNumber, Min } from 'class-validator';

export class CreatePetDto {
  @IsUUID()
  clientId: string;

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

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;
}
