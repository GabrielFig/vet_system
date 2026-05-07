import { IsString, IsInt, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsInt() @Min(0) @Type(() => Number) minStock?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) costPrice?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) salePrice?: number;
}
