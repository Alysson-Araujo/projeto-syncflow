import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { File, FileStatus } from '@app/database';
import { StorageService } from '@app/storage';
import { RedisCacheService } from '@app/redis';
import { ListFilesDto } from './dto/list-files.dto';
import { FileResponseDto, ListFilesResponseDto } from './dto/file-response.dto';

@Injectable()
export class MetadataApiService {
  private readonly logger = new Logger(MetadataApiService.name);
  private readonly CACHE_TTL = 3600; // 1 hora
  private readonly LIST_CACHE_TTL = 300; // 5 minutos (listas mudam mais)

  constructor(
    private readonly em: EntityManager,
    private readonly storageService: StorageService,
    private readonly cacheService: RedisCacheService,
  ) {}

  /**
   * Listar arquivos com filtros e paginação
   */
  async listFiles(dto: ListFilesDto): Promise<ListFilesResponseDto> {
    this.logger.log(`📋 Listing files: ${JSON.stringify(dto)}`);

    // Construir where clause
    const where:  any = {};

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.mimeType) {
      where.mimeType = { $like: `%${dto.mimeType}%` };
    }

    // Ordenação
    const orderBy:  any = {};
    if (dto. sortBy === 'createdAt') {
      orderBy.createdAt = dto.order;
    } else if (dto. sortBy === 'name') {
      orderBy.name = dto.order;
    } else if (dto.sortBy === 'size') {
      orderBy.sizeInBytes = dto.order;
    }

    // Buscar no banco
    const [files, total] = await this. em.findAndCount(
      File,
      where,
      {
        limit: dto.limit,
        offset: dto.offset,
        orderBy,
      }
    );

    const hasMore = dto.offset!  + dto.limit! < total;

    this.logger.log(`✅ Found ${files.length} files (total: ${total})`);

    return {
      data: files. map((file) => this.mapToDto(file)),
      total,
      limit: dto.limit! ,
      offset: dto.offset!,
      hasMore,
    };
  }

  /**
   * Buscar arquivo por ID (com cache)
   */
  async getFileById(fileId: string): Promise<FileResponseDto> {
    this.logger.log(`🔍 Getting file: ${fileId}`);

    // 1. Tentar buscar no cache
    const cacheKey = `file:${fileId}`;
    const cached = await this.cacheService. get<File>(cacheKey);

    if (cached) {
      this.logger.debug(`💾 Cache HIT:  ${fileId}`);
      return this.mapToDto(cached as any);
    }

    // 2. Cache MISS → Buscar no banco
    this.logger.debug(`🔍 Cache MISS: ${fileId}`);
    const file = await this.em.findOne(File, { id: fileId });

    if (!file) {
      throw new NotFoundException(`File ${fileId} not found`);
    }

    // 3. Cachear se estiver COMPLETED
    if (file.status === FileStatus. COMPLETED) {
      await this.cacheFile(file);
    }

    return this.mapToDto(file);
  }

 /**
 * Buscar apenas status do arquivo
 */
async getFileStatus(fileId: string): Promise<{
  id: string;
  status: FileStatus;
  processedAt?: Date;
  failureReason?: string;  // ✅ MUDOU de errorMessage para failureReason
}> {
  this.logger. log(`📊 Getting status for file: ${fileId}`);

  const file = await this.getFileById(fileId);

  return {
    id: file.id,
    status: file.status,
    processedAt: file.processedAt,
    failureReason: file.failureReason,  // ✅ CORRIGIDO
  };
}
  /**
   * Gerar URL de download
   */
  async getDownloadUrl(fileId: string): Promise<{ downloadUrl: string; expiresIn: number }> {
    this.logger.log(`⬇️  Generating download URL for file: ${fileId}`);

    const file = await this.getFileById(fileId);

    if (file.status !== FileStatus. COMPLETED) {
      throw new NotFoundException(
        `File ${fileId} is not ready for download (status: ${file.status})`
      );
    }

    const downloadUrl = await this.storageService.generatePresignedPutUrl(
      file.storageKey,
      file.mimeType,
      3600
    );

    return {
      downloadUrl,
      expiresIn: 3600,
    };
  }

  /**
   * Estatísticas gerais
   */
  /**
 * Estatísticas gerais
 */
async getStats(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  totalSize: number;
  averageSize: number;
}> {
  this.logger.log(`📊 Getting statistics`);

  // Tentar buscar do cache
  const cacheKey = 'stats:general';
  const cached = await this.cacheService. get<any>(cacheKey);

  if (cached) {
    this.logger.debug(`💾 Stats cache HIT`);
    return cached;
  }

  // Cache MISS → Calcular
  this.logger.debug(`🔍 Stats cache MISS - Calculating...`);

  const total = await this.em.count(File);

  // Count by status
  const byStatus:  Record<string, number> = {};
  for (const status of Object.values(FileStatus)) {
    byStatus[status] = await this.em.count(File, { status });
  }

  // ✅ CORRIGIDO: Usar query nativa para calcular total e average
  const connection = this.em.getConnection();
  const result = await connection.execute(`
    SELECT 
      COALESCE(SUM(size_in_bytes), 0) as total_size,
      COALESCE(AVG(size_in_bytes), 0) as avg_size
    FROM files
    WHERE size_in_bytes IS NOT NULL
  `);

  const totalSize = Number(result[0]?.total_size || 0);
  const averageSize = Number(result[0]?.avg_size || 0);

  const stats = {
    total,
    byStatus,
    totalSize,
    averageSize:  Math.round(averageSize),
  };

  // Cachear stats por 5 minutos
  await this. cacheService.set(cacheKey, stats, 300);

  return stats;
}

  /**
   * Helper:  Cachear arquivo
   */
  private async cacheFile(file: File): Promise<void> {
    const cacheKey = `file:${file.id}`;

    const cacheData = {
      id: file. id,
      name: file. name,
      storageKey:  file.storageKey,
      mimeType: file.mimeType,
      sizeInBytes: file.sizeInBytes,
      status: file.status,
      hash: file.hash,
      metadata: file.metadata,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      processedAt: file.processedAt,
      failureReason:  file.failureReason,
    };

    await this.cacheService.set(cacheKey, cacheData, this.CACHE_TTL);
    this.logger.debug(`💾 Cached file: ${file.id}`);
  }

  /**
 * Helper: Mapear entidade para DTO
 */
private mapToDto(file: File | any): FileResponseDto {
  return {
    id: file.id,
    name: file.name,
    storageKey: file.storageKey,
    mimeType: file.mimeType,
    status: file.status,
    sizeInBytes: file.sizeInBytes,
    hash: file.hash,
    metadata: file.metadata,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    processedAt: file.processedAt,
    failureReason: file. failureReason,  // ✅ CORRIGIDO
  };
}
}