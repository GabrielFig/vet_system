import { IsString, IsUUID } from 'class-validator';

export class SelectClinicDto {
  @IsString()
  tempToken: string;

  @IsUUID()
  clinicId: string;
}
