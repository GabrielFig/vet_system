import { IsString, MinLength } from 'class-validator';

export class CreateConsultationDto {
  @IsString()
  @MinLength(3)
  reason: string;
}
