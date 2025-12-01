import { IsInt, IsOptional, IsPositive, IsString, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUploadDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  mimeType?: string;

  
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sizeInBytes?: number;
}