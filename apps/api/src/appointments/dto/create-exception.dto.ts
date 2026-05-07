import { IsISO8601, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateExceptionDto {
  @IsISO8601()
  date: string;

  @IsBoolean()
  isClosed: boolean;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
