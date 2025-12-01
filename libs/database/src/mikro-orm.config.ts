import { LoadStrategy } from '@mikro-orm/core';
import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { ConfigService } from '@nestjs/config';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

// --- MUDANÇA PRINCIPAL ---
// 1. Importe a array de entidades que você acabou de criar.
import { ALL_ENTITIES } from './index';

// O TsMorphMetadataProvider e o 'path' não são mais necessários para a descoberta de entidades.
// import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
// import * as path from 'path';

export function getMikroOrmConfig(configService: ConfigService): MikroOrmModuleOptions {
  // const baseDir = process.cwd(); // Não é mais necessário para entidades

  return {
    // metadataProvider: TsMorphMetadataProvider, // Não é mais necessário

    // 2. Passe a lista de entidades diretamente.
    // Isso remove completamente a necessidade de escanear o sistema de arquivos.
    entities: ALL_ENTITIES, 
    
    // entitiesTs e entities não são mais necessários com a abordagem acima.
    // entities: [path.join(baseDir, 'dist', '**', '*.entity.js')],
    // entitiesTs: [path.join(baseDir, 'libs', 'database', 'src', 'entities')],

    // --- FIM DA MUDANÇA ---

    dbName: configService.get<string>('DB_NAME'),
    user: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASSWORD'),
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT', 5432),
    driver: PostgreSqlDriver,
    loadStrategy: LoadStrategy.JOINED,

    migrations: {
      // Você ainda precisa de caminhos para migrações, então mantenha-os.
      path: 'dist/libs/database/src/migrations',
      pathTs: 'libs/database/src/migrations',
    },

    pool: {
      min: 2,
      max: 20,
    },
    debug: process.env.NODE_ENV !== 'production',
  };
}