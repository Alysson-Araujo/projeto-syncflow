import { Logger } from '@nestjs/common';
import { IMediaProcessor, ProcessingResult } from '../interfaces/media-processor.interface';

export abstract class BaseProcessor implements IMediaProcessor {
  protected readonly logger: Logger;

  constructor(loggerContext: string) {
    this.logger = new Logger(loggerContext);
  }

  abstract canProcess(mimeType: string): boolean;
  abstract process(fileId: string, storageKey: string, mimeType: string): Promise<ProcessingResult>;
}