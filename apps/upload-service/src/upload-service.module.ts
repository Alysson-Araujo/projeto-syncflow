import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule, File } from '@app/database';
import { StorageModule } from '@app/storage';
import { UploadServiceController } from './upload-service.controller';
import { UploadService } from './upload-service.service';
import { RabbitMQModule, EventPublisherService  } from '@app/messaging';
import { RedisModule } from '@app/redis';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule.forRoot(),
    MikroOrmModule.forFeature([File]),
    StorageModule,
    RabbitMQModule.forRootAsync(),
    RedisModule
  ],
  controllers: [UploadServiceController],
  providers: [UploadService, EventPublisherService ],
})
export class UploadServiceModule {}