import { IsString, IsISO8601, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  petId: string;

  @IsISO8601()
  startsAt: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
