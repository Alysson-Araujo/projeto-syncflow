import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { File } from './file.entity';

@Entity({ tableName: 'processing_logs' })
export class ProcessingLog {
  @PrimaryKey({ type: 'uuid' })
  id: string = Math.random().toString(36).substring(2, 15);

  @Property()
  message!: string;

  @Property({ type: 'jsonb', nullable: true })
  details?: Record<string, any>;

  @Property({ fieldName: 'created_at' })
  createdAt: Date = new Date();

  @ManyToOne(() => File, { 
    fieldName: 'file_id',
    deleteRule: 'cascade',
    updateRule: 'cascade'
  })
  file!: File;

  constructor(init?: Partial<ProcessingLog>) {
    Object.assign(this, init);
  }

  static createErrorLog(message: string, error: any, file: File): ProcessingLog {
    return new ProcessingLog({
      message,
      details: {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      },
      file
    });
  }

  static createProcessLog(message: string, file: File, additionalDetails?: any): ProcessingLog {
    return new ProcessingLog({
      message,
      details: additionalDetails,
      file
    });
  }
}