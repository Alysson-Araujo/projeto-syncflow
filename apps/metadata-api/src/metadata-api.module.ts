import { Module } from '@nestjs/common';
import { MetadataApiController } from './metadata-api.controller';
import { MetadataApiService } from './metadata-api.service';

@Module({
  imports: [],
  controllers: [MetadataApiController],
  providers: [MetadataApiService],
})
export class MetadataApiModule {}
