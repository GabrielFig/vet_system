import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(10)
  content: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
