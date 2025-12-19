import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { File, FileStatus } from '@app/database';
import { StorageService } from '@app/storage';
import { EventPublisherService, RabbitMQService } from '@app/messaging';
import { v4 as uuidv4 } from 'uuid';
import { CreateUploadDto } from './dtos/get-presigned-url.dto';
import { RedisCacheService } from '@app/redis';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly storageService: StorageService,
    @InjectRepository(File)
    private readonly fileRepository: EntityRepository<File>,
    private readonly em: EntityManager,
    private readonly eventPublisher: EventPublisherService,
    private readonly cacheService: RedisCacheService
  ) {}

  async createUpload(data: CreateUploadDto) {
    const id = uuidv4();
    const storageKey = data.name ?  `${id}/${data.name}` : id;

    const file = new File({
      id,
      storageKey,
      name: data.name || 'unnamed',
      mimeType: data.mimeType || 'application/octet-stream',
      status: FileStatus.PENDING,
      sizeInBytes: data.sizeInBytes,
    });

    await this.em.persist(file).flush();

    await this.cacheFile(file);

    await this.cacheService.set(`file:${id}`, file, 3600); // 1 hora
    this.logger.debug(`💾 File cached: ${id}`);

    this.logger.log(`📁 File created: ${id} - ${file.name}`);

    const uploadUrl = await this.storageService.getPresignedPutUrl(
      storageKey,
      3600,
      data.mimeType
    );

    return {
      id,
      storageKey,
      uploadUrl,
      expiresIn: 3600,
    };
  }

  async completeUpload(fileId:  string) {
  this.logger.log(`🔍 Completing upload: ${fileId}`);

  // ✅ SEMPRE buscar do banco (não usar cache)
  const file = await this.em.findOne(File, { id: fileId });

  if (!file) {
    throw new NotFoundException(`File ${fileId} not found`);
  }

  // Log para debug
  this.logger.debug(`📋 File data: ${JSON.stringify({
    id: file.id,
    storageKey: file.storageKey,
    name:  file.name,
    status: file.status
  })}`);

  // Validar arquivo no S3
  this.logger.log(`🔍 Validating file in S3: ${file.storageKey}`);
  
  const exists = await this.storageService.fileExists(file.storageKey);

  if (!exists) {
    throw new NotFoundException(
      `File not found in storage: ${file.storageKey}`
    );
  }

  const metadata = await this.storageService.getObjectMetadata(file.storageKey);

  // Atualizar status
  file.status = FileStatus.PROCESSING;
  file.sizeInBytes = metadata.ContentLength || file.sizeInBytes;
  await this.em.flush();
  
  // ✅ Atualizar cache após mudança de status
  await this.cacheFile(file);

  this.logger.log(
    `✅ Upload completed: ${file.id} - ${file.name} (${this.formatBytes(
      file.sizeInBytes || 0
    )})`
  );

  // Publicar evento
  await this.eventPublisher.publish('file.uploaded', {
    fileId:  file.id,
    storageKey: file.storageKey,
    name: file.name,
    mimeType: file.mimeType,
    size:  file.sizeInBytes,
    createdAt: file.createdAt.toISOString(),
  }, );

  return {
    id: file.id,
    status: file.status,
    message: 'Upload completed successfully',
  };
}

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private async cacheFile(file: File): Promise<void> {
  const cacheKey = `file:${file.id}`;

  // Serializar apenas os dados necessários
  const cacheData = {
    id: file.id,
    name: file.name,
    storageKey: file.storageKey, 
    mimeType:  file.mimeType,
    sizeInBytes: file.sizeInBytes,
    status:  file.status,
    hash: file.hash,
    metadata: file.metadata,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    processedAt: file.processedAt,
  };

  await this.cacheService.set(cacheKey, cacheData, 3600);
  this.logger.debug(`💾 Cached file: ${file.id} (TTL: 3600s)`);
}
}