import { Module } from '@nestjs/common';
import { StorageModule } from '@app/storage';
import { ImageProcessor } from './processors/image.processor';
import { MediaProcessorFactory } from './media-processor.factory';

@Module({
  imports: [StorageModule],
  providers: [ImageProcessor, MediaProcessorFactory],
  exports: [MediaProcessorFactory],
})
export class MediaProcessorModule {}