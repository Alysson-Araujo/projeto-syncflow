import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getMikroOrmConfig } from './mikro-orm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    MikroOrmModule.forRootAsync({
      // Importa o ConfigModule para que o ConfigService esteja disponível na factory
      imports: [ConfigModule],
      // Injeta o ConfigService na sua factory
      inject: [ConfigService],
      // A factory usa o ConfigService para obter as variáveis de ambiente
      // e construir o objeto de configuração do MikroORM.
      useFactory: (configService: ConfigService) => getMikroOrmConfig(configService),
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
