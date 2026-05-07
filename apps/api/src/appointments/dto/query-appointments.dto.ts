import { IsOptional, IsString, IsISO8601, IsEnum } from 'class-validator';

export class QueryAppointmentsDto {
  @IsOptional()
  @IsISO8601()
  date?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsEnum(['PENDING', 'CONFIRMED', 'CANCELLED', 'DONE'])
  status?: string;
}
