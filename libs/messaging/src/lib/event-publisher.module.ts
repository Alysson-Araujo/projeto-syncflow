import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventPublisherService } from './event-publisher.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EventPublisherService],
  exports: [EventPublisherService],
})
export class EventPublisherModule {}