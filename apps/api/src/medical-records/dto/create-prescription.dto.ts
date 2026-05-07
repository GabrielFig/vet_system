import { IsString, IsOptional, IsISO8601 } from 'class-validator';

export class CreatePrescriptionDto {
  @IsString()
  diagnosis: string;

  @IsString()
  medications: string;

  @IsString()
  instructions: string;

  @IsOptional()
  @IsISO8601()
  validUntil?: string;
}
