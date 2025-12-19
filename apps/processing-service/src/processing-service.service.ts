import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { File, FileStatus } from '@app/database';
import { StorageService } from '@app/storage';
import { EventPublisherService } from '@app/messaging';
import { RedisCacheService, RedisLockService } from '@app/redis';
import { createHash } from 'crypto';
import { Readable } from 'stream';
import { MediaProcessorFactory } from 'media-processor';

@Injectable()
export class ProcessingServiceService {
  private readonly logger = new Logger(ProcessingServiceService.name);
  private stats = {
    processed: 0,
    failed:  0,
    startTime:  new Date(),
  };
  private readonly CACHE_TTL = 3600

  constructor(
    @InjectRepository(File)
    private readonly fileRepository: EntityRepository<File>,
    private readonly em: EntityManager,
    private readonly storageService:  StorageService,
    private readonly eventPublisher:  EventPublisherService,
    private readonly lockService: RedisLockService,
    private readonly cacheService: RedisCacheService,
    private readonly mediaProcessorFactory: MediaProcessorFactory, 
  ) {}

  async processFile(fileId: string): Promise<void> {
    const lockAcquired = await this.lockService.acquire(`file:${fileId}`, 300);
    
    if (!lockAcquired) {
      this.logger.warn(`⚠️ File ${fileId} is already being processed.Skipping...`);
      return;
    }

    this.logger.log(`🔒 Lock acquired for file: ${fileId}`);
    this.logger.log(`🔄 Processing file: ${fileId}`);

    const em = this.em.fork();
    
    try {
      const file = await em.findOne(File, { id: fileId });

      if (!file) {
        this.logger.error(`❌ File not found: ${fileId}`);
        throw new Error(`File not found: ${fileId}`);
      }

      if (file.status === FileStatus.COMPLETED) {
        this.logger.warn(`⚠️ File ${fileId} already processed.Skipping...`);
        return;
      }

      // 1.Download e calcular hash (sempre)
      this.logger.log(`📥 Downloading from S3: ${file.storageKey}`);
      const stream = await this.storageService.getObjectStream(file.storageKey);

      this.logger.log(`🔐 Calculating SHA256 hash...`);
      const hash = await this.calculateHash(stream);
      
      // 2.Extrair metadados básicos
      const metadata = await this.extractMetadata(file);

      // 3.Processar mídia específica (se suportado)
      let processingResult = null;
      
      if (this.mediaProcessorFactory.canProcess(file.mimeType)) {
        this.logger.log(`🎨 Media processor available for ${file.mimeType}`);
        
        const processor = this.mediaProcessorFactory.getProcessor(file.mimeType);
        
        if (processor) {
          processingResult = await processor.process(fileId, file.storageKey, file.mimeType);
          
          if (processingResult.success) {
            this.logger.log(`✅ Media processing completed`);
            
            // Adicionar metadados de mídia
            if (processingResult.metadata) {
              metadata.image = processingResult.metadata;
            }
            
            // Adicionar thumbnails
            if (processingResult.thumbnails) {
              file.thumbnails = processingResult.thumbnails;
              this.logger.log(`📸 Generated ${processingResult.thumbnails.length} thumbnails`);
            }
          } else {
            this.logger.warn(`⚠️ Media processing failed:  ${processingResult.error}`);
          }
        }
      } else {
        this.logger.debug(`ℹ️ No media processor for ${file.mimeType}`);
      }

      // 4.Atualizar arquivo
      file.hash = hash;
      file.metadata = metadata;
      file.markAsCompleted();
      
      await em.flush();

      await this.cacheFile(file);

      this.logger.log(`✅ File processed successfully: ${fileId}`);
      this.logger.log(`   Hash: ${hash}`);
      this.logger.log(`   Status: ${file.status}`);
      if (file.hasThumbnails()) {
        this.logger.log(`   Thumbnails: ${file.thumbnails?.length}`);
      }

      // 5.Publicar evento
      await this.eventPublisher.publish('file.processed', {
        fileId:  file.id,
        storageKey: file.storageKey,
        name: file.name,
        hash,
        metadata,
        thumbnails: file.thumbnails,
        processedAt: new Date().toISOString(),
      });

      this.stats.processed++;

    } catch (error:  any) {
      this.logger.error(`❌ Failed to process file ${fileId}: ${error.message}`);

      const file = await em.findOne(File, { id: fileId });
      
      if (file) {
        file.markAsFailed(error.message);
        await em.flush();
      }

      await this.eventPublisher.publish('file.failed', {
        fileId,
        storageKey: file?.storageKey,
        name: file?.name,
        error: error.message,
        failedAt: new Date().toISOString(),
      });

      this.stats.failed++;
      throw error;

    } finally {
      await this.lockService.release(`file:${fileId}`);
      this.logger.log(`🔓 Lock released for file: ${fileId}`);
    }
  }

  private async calculateHash(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');

      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private async extractMetadata(file: File): Promise<Record<string, any>> {
    const metadata: Record<string, any> = {
      name: file.name,
      mimeType: file.mimeType,
      size: file.sizeInBytes,
      uploadedAt: file.createdAt.toISOString(),
    };

    return metadata;
  }

  getStats() {
    const uptime = Date.now() - this.stats.startTime.getTime();
    
    return {
      processed: this.stats.processed,
      failed: this.stats.failed,
      uptime:  Math.floor(uptime / 1000),
      startTime: this.stats.startTime,
    };
  }
  async getFile(fileId: string): Promise<File | null> {
    // 1.Tentar buscar no cache
    const cacheKey = `file:${fileId}`;
    const cached = await this.cacheService.get<File>(cacheKey);

    if (cached) {
      this.logger.debug(`💾 Cache HIT: ${fileId}`);
      return cached;
    }

    // 2.Cache MISS → Buscar no banco
    this.logger.debug(`🔍 Cache MISS: ${fileId} - Querying database`);
    const file = await this.em.findOne(File, { id: fileId });

    if (!file) {
      return null;
    }

    // 3.Se o arquivo está COMPLETED, cachear
    if (file.status === FileStatus.COMPLETED) {
      await this.cacheFile(file);
    }

    return file;
  }
  private async cacheFile(file: File): Promise<void> {
    const cacheKey = `file:${file.id}`;
    
    // Serializar apenas os dados necessários
    const cacheData = {
      id: file.id,
      name: file.name,
      storageKey:  file.storageKey,
      mimeType: file.mimeType,
      sizeInBytes: file.sizeInBytes,
      status: file.status,
      hash: file.hash,
      metadata: file.metadata,
      thumbnails: file.thumbnails,
      createdAt: file.createdAt,
      processedAt: file.processedAt,
    };

    await this.cacheService.set(cacheKey, cacheData, this.CACHE_TTL);
    this.logger.debug(`💾 Cached file: ${file.id} (TTL: ${this.CACHE_TTL}s)`);
  }
  
}