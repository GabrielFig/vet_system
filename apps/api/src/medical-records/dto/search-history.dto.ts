import { IsOptional, IsString, IsISO8601 } from 'class-validator';

export class SearchHistoryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
