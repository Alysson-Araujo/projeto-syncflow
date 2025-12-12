import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule, File } from '@app/database';  // ← Importar de @app/database
import { StorageModule } from '@app/storage';
import { UploadServiceController } from './upload-service.controller';
import { UploadService } from './upload-service.service';
import { RabbitMQModule } from '@app/messaging';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule.forRoot(),
    MikroOrmModule.forFeature([File]),
    StorageModule,
    RabbitMQModule.forRootAsync(),
  ],
  controllers: [UploadServiceController],
  providers: [UploadService],
})
export class UploadServiceModule {}