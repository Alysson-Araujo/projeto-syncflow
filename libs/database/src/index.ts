export * from './database.module';
export * from './database.service';

import { File } from '../src/entities/file.entity';
import { ProcessingLog } from '../src/entities/processing-log.entity';

export const ALL_ENTITIES = [File, ProcessingLog];