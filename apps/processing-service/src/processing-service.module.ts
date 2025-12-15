import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule, File } from '@app/database';
import { StorageModule } from '@app/storage';
import { EventPublisherService, RabbitMQModule } from '@app/messaging';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ProcessingServiceController } from './processing-service.controller';
import { ProcessingServiceService } from './processing-service.service';
import { FileProcessor } from './processors/file.processor';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule. forRoot(),
    MikroOrmModule.forFeature([File]),
    StorageModule,
    RabbitMQModule.forRootAsync(),
  ],
  controllers: [ProcessingServiceController, FileProcessor],
  providers: [ProcessingServiceService, EventPublisherService],
})
export class ProcessingServiceModule {}