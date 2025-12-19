import { Injectable, Logger } from '@nestjs/common';
import { IMediaProcessor } from './interfaces/media-processor.interface';
import { ImageProcessor } from './processors/image.processor';

@Injectable()
export class MediaProcessorFactory {
  private readonly logger = new Logger(MediaProcessorFactory. name);
  private processors: IMediaProcessor[] = [];

  constructor(private readonly imageProcessor: ImageProcessor) {
    // Registrar processors disponíveis
    this.registerProcessor(imageProcessor);
  }

  /**
   * Registrar um processor
   */
  private registerProcessor(processor: IMediaProcessor): void {
    this.processors.push(processor);
    this.logger.log(`📦 Registered processor: ${processor.constructor.name}`);
  }

  /**
   * Obter processor adequado para o mimeType
   */
  getProcessor(mimeType: string): IMediaProcessor | null {
    const processor = this.processors.find((p) => p.canProcess(mimeType));

    if (processor) {
      this.logger.debug(`✅ Found processor for ${mimeType}:  ${processor.constructor.name}`);
    } else {
      this.logger.debug(`❌ No processor found for ${mimeType}`);
    }

    return processor || null;
  }

  /**
   * Verificar se existe processor para o mimeType
   */
  canProcess(mimeType: string): boolean {
    return this.processors.some((p) => p.canProcess(mimeType));
  }

  /**
   * Listar todos os mimeTypes suportados
   */
  getSupportedMimeTypes(): string[] {
    // Simplificado: retornar categorias
    return ['image/*'];
  }
}