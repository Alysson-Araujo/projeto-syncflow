export * from './lib/database.module';
export * from './lib/database.service';

export * from './lib/entities/file.entity';
export * from './lib/entities/processing-log.entity';


import { File } from './lib/entities/file.entity';
import { ProcessingLog } from './lib/entities/processing-log.entity';

export const ALL_ENTITIES = [File, ProcessingLog];