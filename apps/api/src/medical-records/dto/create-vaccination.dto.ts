import { IsString, IsISO8601, IsOptional } from 'class-validator';

export class CreateVaccinationDto {
  @IsString()
  vaccineName: string;

  @IsOptional()
  @IsString()
  batch?: string;

  @IsISO8601()
  appliedAt: string;

  @IsOptional()
  @IsISO8601()
  nextDose?: string;
}
