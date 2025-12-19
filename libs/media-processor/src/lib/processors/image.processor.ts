import { Injectable, Logger } from '@nestjs/common';
import { StorageService } from '@app/storage';
// import * as sharp from 'sharp';
import { Readable } from 'stream';
import { BaseProcessor } from './base.processor';
import {
  ProcessingResult,
  ThumbnailSize,
  ThumbnailResult,
  ImageMetadata,
} from '../interfaces/media-processor.interface';

const sharp = require('sharp');
@Injectable()
export class ImageProcessor extends BaseProcessor {
  private readonly thumbnailSizes: ThumbnailSize[] = [
    { name: 'small', width: 150, height: 150 },
    { name:  'medium', width: 400, height: 400 },
    { name: 'large', width: 800, height: 800 },
  ];

  constructor(private readonly storageService: StorageService) {
    super(ImageProcessor.name);
  }

  canProcess(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  async process(
    fileId: string,
    storageKey: string,
    mimeType: string
  ): Promise<ProcessingResult> {
    try {
      this.logger.log(`🖼️  Processing image: ${fileId}`);

      // 1. Download imagem do S3
      this.logger.debug(`📥 Downloading image from S3: ${storageKey}`);
      const stream = await this.storageService.getObjectStream(storageKey);

      // 2. Converter stream para buffer
      const buffer = await this.streamToBuffer(stream);

      // 3. Extrair metadados
      this.logger.debug(`📊 Extracting metadata... `);
      const metadata = await this.extractMetadata(buffer);

      // 4. Gerar thumbnails
      this.logger.debug(`🔨 Generating thumbnails...`);
      const thumbnails = await this.generateThumbnails(fileId, buffer);

      this.logger.log(`✅ Image processed:  ${fileId} (${thumbnails.length} thumbnails)`);

      return {
        success:  true,
        metadata,
        thumbnails,
      };
    } catch (error:  any) {
      this.logger.error(`❌ Failed to process image ${fileId}:  ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Extrair metadados da imagem
   */
  private async extractMetadata(buffer: Buffer): Promise<ImageMetadata> {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: buffer.length,
      hasAlpha: metadata.hasAlpha || false,
      orientation: metadata.orientation,
      exif: metadata.exif as Record<string, any>,
    };
  }

  /**
   * Gerar thumbnails em múltiplos tamanhos
   */
  private async generateThumbnails(
    fileId:  string,
    buffer: Buffer
  ): Promise<ThumbnailResult[]> {
    const results: ThumbnailResult[] = [];

    for (const size of this.thumbnailSizes) {
      try {
        this.logger.debug(`  📐 Generating ${size.name} (${size.width}x${size.height})`);

        // Redimensionar imagem
        const thumbnailBuffer = await sharp(buffer)
          .resize(size.width, size.height, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({ quality: 85 })
          .toBuffer();

        // Storage key: thumbnails/{fileId}/{size}.jpg
        const storageKey = `thumbnails/${fileId}/${size.name}.jpg`;

        // Upload para S3
        await this.uploadThumbnail(storageKey, thumbnailBuffer);

        // Metadata do thumbnail
        const thumbMetadata = await sharp(thumbnailBuffer).metadata();

        results.push({
          size: size.name,
          width: thumbMetadata.width || size.width,
          height: thumbMetadata.height || size.height,
          storageKey,
        });

        this.logger.debug(`  ✅ ${size.name} uploaded:  ${storageKey}`);
      } catch (error:  any) {
        this.logger.error(`  ❌ Failed to generate ${size.name}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Upload thumbnail para S3
   */
  private async uploadThumbnail(storageKey:  string, buffer: Buffer): Promise<void> {
  await this.storageService.uploadBuffer(storageKey, buffer, 'image/jpeg');
}

  /**
   * Converter stream para buffer
   */
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}