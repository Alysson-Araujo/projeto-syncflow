import { 
  Entity, 
  PrimaryKey, 
  Property, 
  OneToMany, 
  Collection, 
  Enum, 
  BigIntType 
} from '@mikro-orm/core';
import { ProcessingLog } from './processing-log.entity';

export enum FileStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

@Entity({ tableName: 'files' })
export class File {
    constructor(init?: Partial<File>) {
    Object.assign(this, init);
  }

  @PrimaryKey({ type: 'uuid' })
  id: string = Math.random().toString(36).substring(2, 15); // Será sobrescrito pelo DB

  @Property()
  name!: string;

  @Property({ fieldName: 'storage_key', unique: true })
  storageKey!: string;

  @Enum(() => FileStatus)
  status: FileStatus = FileStatus.PENDING;

  @Property({ fieldName: 'mime_type' })
  mimeType!: string;

  @Property({ fieldName: 'size_in_bytes', type: BigIntType })
  sizeInBytes!: bigint;

  @Property({ nullable: true })
  hash?: string;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Property({ fieldName: 'failure_reason', nullable: true })
  failureReason?: string;

  @Property({ fieldName: 'created_at' })
  createdAt: Date = new Date();

  @Property({ fieldName: 'updated_at', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ fieldName: 'processed_at', nullable: true })
  processedAt?: Date;

  @OneToMany(() => ProcessingLog, log => log.file)
  logs = new Collection<ProcessingLog>(this);



  // Métodos de negócio
  markAsProcessing(): void {
    this.status = FileStatus.PROCESSING;
    this.updatedAt = new Date();
  }

  markAsProcessed(metadata?: Record<string, any>): void {
    this.status = FileStatus.COMPLETED;
    this.processedAt = new Date();
    this.updatedAt = new Date();
    if (metadata) {
      this.metadata = metadata;
    }
  }

  markAsFailed(reason: string): void {
    this.status = FileStatus.FAILED;
    this.failureReason = reason;
    this.updatedAt = new Date();
  }
}