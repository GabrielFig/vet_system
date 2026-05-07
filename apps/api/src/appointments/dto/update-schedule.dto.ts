import { IsArray, IsInt, IsString, Min, Max } from 'class-validator';

export class UpdateScheduleDto {
  @IsArray()
  @IsInt({ each: true })
  workDays: number[];

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsInt()
  @Min(15)
  @Max(120)
  slotMinutes: number;
}
