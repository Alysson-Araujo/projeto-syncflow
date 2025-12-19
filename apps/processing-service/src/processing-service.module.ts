import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule, File } from '@app/database';
import { StorageModule } from '@app/storage';
import { EventPublisherService, RabbitMQModule } from '@app/messaging';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ProcessingServiceController } from './processing-service.controller';
import { ProcessingServiceService } from './processing-service.service';
import { FileProcessor } from './processors/file.processor';
import { RedisModule } from '@app/redis';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule. forRoot(),
    MikroOrmModule.forFeature([File]),
    StorageModule,
    RabbitMQModule.forRootAsync(),
    RedisModule,
  ],
  controllers: [ProcessingServiceController],
  providers: [ProcessingServiceService, EventPublisherService, FileProcessor],
})
export class ProcessingServiceModule {}