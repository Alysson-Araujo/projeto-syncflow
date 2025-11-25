import { Module } from '@nestjs/common';
import { ProcessingServiceController } from './processing-service.controller';
import { ProcessingServiceService } from './processing-service.service';

@Module({
  imports: [],
  controllers: [ProcessingServiceController],
  providers: [ProcessingServiceService],
})
export class ProcessingServiceModule {}
