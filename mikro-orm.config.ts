import { LoadStrategy } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { PostgreSqlDriver, defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import * as dotenv from 'dotenv';


dotenv.config();


import { ALL_ENTITIES } from './libs/database/src/index';


// CONFIGURAÇÃO PARA NESTJS (com ConfigService)
export function getMikroOrmConfig(configService: ConfigService) {
  return {
    entities: ALL_ENTITIES,
    dbName: configService.get<string>('DB_NAME'),
    user: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASSWORD'),
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT', 5432),
    driver: PostgreSqlDriver,
    loadStrategy:  LoadStrategy.JOINED,

    migrations: {
      path: 'dist/libs/database/src/lib/migrations',
      pathTs:  'libs/database/src/lib/migrations',
      tableName: 'mikro_orm_migrations',
      transactional: true,
    },

    pool: {
      min:  2,
      max: 20,
    },

    debug: process.env.NODE_ENV !== 'production',
  };
}

// CONFIGURAÇÃO PARA CLI (sem ConfigService)
export default defineConfig({
  entities: ALL_ENTITIES,
  dbName: process. env.DB_NAME || 'syncflow',
  user: process.env.DB_USER || 'syncflow',
  password: process.env.DB_PASSWORD || 'syncflow123',
  host: process.env. DB_HOST || 'localhost',
  port: parseInt(process. env.DB_PORT || '5432', 10),
  driver: PostgreSqlDriver,
  loadStrategy: LoadStrategy.JOINED,

  migrations: {
    path: 'dist/libs/database/src/lib/migrations',
    pathTs:  'libs/database/src/lib/migrations',
    tableName: 'mikro_orm_migrations',
    transactional:  true,
  },

  extensions: [Migrator],

  pool: {
    min: 2,
    max: 20,
  },

  debug: process.env.NODE_ENV !== 'production',
});