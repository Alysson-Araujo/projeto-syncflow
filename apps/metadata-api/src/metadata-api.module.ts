import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { StorageModule } from '@app/storage';
import { RedisModule } from '@app/redis';
import { MetadataApiController } from './metadata-api.controller';
import { MetadataApiService } from './metadata-api.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';  // ✅ ADICIONAR
import { File } from '@app/database';  // ✅ ADICIONAR


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule.forRoot(),
    StorageModule,
    RedisModule,
    MikroOrmModule.forFeature([File]),
  ],
  controllers: [MetadataApiController],
  providers: [MetadataApiService],
})
export class MetadataApiModule {}