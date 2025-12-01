import { Module } from '@nestjs/common';
import { UploadServiceController } from './upload-service.controller';
import { UploadServiceService } from './upload-service.service';
import { DatabaseModule } from '@app/database';
import { StorageModule } from './storage/storage.module';
import { StorageService } from './storage/storage.service';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [UploadServiceController],
  providers: [UploadServiceService, StorageService],
})
export class UploadServiceModule {}
