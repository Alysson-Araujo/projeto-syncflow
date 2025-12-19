import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileStatus } from '@app/database';

export class FileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  storageKey: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty({ enum: FileStatus })
  status: FileStatus;

  @ApiPropertyOptional()
  sizeInBytes?: number;

  @ApiPropertyOptional()
  hash?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  processedAt?: Date;

  @ApiPropertyOptional()
  failureReason?: string; 
}

export class ListFilesResponseDto {
  @ApiProperty({ type: [FileResponseDto] })
  data: FileResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;

  @ApiProperty()
  hasMore: boolean;
}