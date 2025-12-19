import { DynamicModule, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getMikroOrmConfig } from '../../../../mikro-orm.config';
import { DatabaseService } from './database.service';

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        MikroOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => getMikroOrmConfig(configService),
        }),
      ],
      providers: [DatabaseService],
      exports: [DatabaseService],
    };
  }
}