import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { File, FileStatus } from '@app/database';
import { StorageService } from '@app/storage';
import { EventPublisherService } from '@app/messaging';
import { createHash } from 'crypto';
import { Readable } from 'stream';

@Injectable()
export class ProcessingServiceService {
  private readonly logger = new Logger(ProcessingServiceService.name);
  private stats = {
    processed: 0,
    failed:   0,
    startTime: new Date(),
  };

  constructor(
    @InjectRepository(File)
    private readonly fileRepository: EntityRepository<File>,
    private readonly em: EntityManager,
    private readonly storageService: StorageService,
    private readonly eventPublisher:  EventPublisherService,
  ) {}

  async processFile(fileId: string): Promise<void> {
    this.logger.log(`🔄 Processing file: ${fileId}`);

    // 🔥 CRIAR FORK DO ENTITY MANAGER
    const em = this.em.fork();
    
    const file = await em.findOne(File, { id: fileId });

    if (!file) {
      this.logger.error(`❌ File not found: ${fileId}`);
      throw new Error(`File not found: ${fileId}`);
    }

    try {
      this.logger.log(`📥 Downloading from S3: ${file.storageKey}`);
      const stream = await this.storageService. getObjectStream(file.storageKey);

      this.logger.log(`🔐 Calculating SHA256 hash... `);
      const hash = await this.calculateHash(stream);
      
      const metadata = await this.extractMetadata(file);

      file.hash = hash;
      file.metadata = metadata;
      file.  markAsCompleted();
      
      // 🔥 USAR O EM FORKED
      await em.flush();

      this.logger.log(`✅ File processed successfully: ${fileId}`);
      this.logger.log(`   Hash: ${hash}`);
      this.logger.log(`   Status: ${file.status}`);

      await this.eventPublisher.publish('file.processed', {
        fileId:   file.id,
        storageKey: file.storageKey,
        name: file.name,
        hash,
        metadata,
        processedAt: new Date().toISOString(),
      });

      this.stats.processed++;
    } catch (error:   any) {
      this.logger.error(`❌ Failed to process file ${fileId}: ${error.message}`);

      file.markAsFailed(error.message);
      
      // 🔥 USAR O EM FORKED
      await em.flush();

      await this.eventPublisher.publish('file.failed', {
        fileId:  file.id,
        storageKey: file.storageKey,
        name: file.name,
        error: error.message,
        failedAt: new Date().toISOString(),
      });

      this.stats.failed++;
      throw error;
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
      uploadedAt: file.createdAt. toISOString(),
    };

    return metadata;
  }

  getStats() {
    const uptime = Date.now() - this.stats.startTime. getTime();
    
    return {
      processed: this.stats.processed,
      failed: this.stats.failed,
      uptime:   Math.floor(uptime / 1000),
      startTime: this.stats.  startTime,
    };
  }
}