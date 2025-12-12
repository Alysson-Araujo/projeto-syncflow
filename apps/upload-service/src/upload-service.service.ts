import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { File, FileStatus } from '@app/database';
import { StorageService } from '@app/storage';
import { RabbitMQService } from '@app/messaging';
import { v4 as uuidv4 } from 'uuid';
import { CreateUploadDto } from './dtos/get-presigned-url.dto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly storageService: StorageService,
    @InjectRepository(File)
    private readonly fileRepository: EntityRepository<File>,
    private readonly em: EntityManager,
    private readonly rabbitMQService: RabbitMQService,
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

  async completeUpload(id: string) {
    const file = await this.fileRepository.findOne({ id });

    if (!file) {
      throw new NotFoundException(`File with id ${id} not found`);
    }

    try {
      // 1. Validar arquivo no S3
      this.logger.log(`🔍 Validating file in S3: ${file.storageKey}`);
      const stat = await this.storageService.statObject(file. storageKey);

      // 2. Atualizar status no banco
      file.markAsProcessing();
      file.updateSize(stat.size);
      await this.em.flush();

      this.logger.log(
        `✅ Upload completed:  ${id} - ${file.name} (${file.getFormattedSize()})`
      );

      // 3. 🔥 PUBLICAR EVENTO NO RABBITMQ
      await this. rabbitMQService.emit('file.uploaded', {
        fileId: file.id,
        storageKey: file.storageKey,
        name: file.name,
        mimeType: file.mimeType,
        size: file.sizeInBytes,
        createdAt: file.createdAt. toISOString(),
      });

      return {
        id:  file.id,
        name: file.name,
        storageKey: file.storageKey,
        status: file.status,
        size: file.sizeInBytes! ,
        formattedSize: file.getFormattedSize(),
        mimeType: file.mimeType,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      };
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to complete upload for ${id}: ${error.message}`
      );

      file.markAsFailed(`File not found in storage:  ${error.message}`);
      await this.em.flush();

      throw new NotFoundException(
        `File ${id} not found in storage. Upload may have failed.`
      );
    }
  }
}