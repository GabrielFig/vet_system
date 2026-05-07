import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;
}

export class UpdateAppointmentStatusDto {
  @IsEnum(['PENDING', 'CONFIRMED', 'CANCELLED', 'DONE'])
  status: string;
}
