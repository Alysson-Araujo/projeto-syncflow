import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FileStatus } from '@app/database';
import { PaginationDto } from './pagination.dto';

export class ListFilesDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: FileStatus,
  })
  @IsOptional()
  @IsEnum(FileStatus)
  status?: FileStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo MIME',
    example: 'image/png',
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'Ordenar por campo',
    enum: ['createdAt', 'name', 'size'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'name' | 'size' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Ordem de ordenação',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsString()
  order?: 'ASC' | 'DESC' = 'DESC';
}