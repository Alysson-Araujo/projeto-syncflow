import { 
  Entity, 
  PrimaryKey, 
  Property, 
  OneToMany, 
  Collection, 
  Enum, 
  BigIntType,
  OptionalProps
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
  [OptionalProps]?: 'id' | 'status' | 'createdAt' | 'updatedAt' | 'logs'; 

    constructor(init?: Partial<File>) {
    Object.assign(this, init);
  }

  @PrimaryKey({ type: 'uuid' })
  id: string = Math.random().toString(36).substring(2, 15);

  @Property()
  name!: string;

  @Property({ fieldName: 'storage_key', unique: true })
  storageKey!: string;

  @Enum(() => FileStatus)
  status: FileStatus = FileStatus.PENDING;

  @Property({ fieldName: 'mime_type' })
  mimeType!: string;

  @Property({ fieldName: 'size_in_bytes', type: 'bigint', nullable: true })
  sizeInBytes?: number;

  @Property({ type: 'varchar', length: 64, nullable: true })
  hash?: string;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Property({ fieldName: 'failure_reason', nullable: true })
  failureReason?: string;

  @Property({ fieldName: 'created_at' })
  createdAt:  Date = new Date();

  @Property({ fieldName: 'updated_at', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ fieldName: 'processed_at', nullable: true })
  processedAt?: Date;

  @OneToMany(() => ProcessingLog, log => log.file)
  logs = new Collection<ProcessingLog>(this);




  markAsProcessing(): void {
    if (this.status !== FileStatus. PENDING) {
      throw new Error(`Cannot process file with status:  ${this.status}`);
    }
    this.status = FileStatus.PROCESSING;
  }

  markAsCompleted(hash?: string, metadata?: Record<string, any>): void {
    if (this.status !== FileStatus.PROCESSING) {
      throw new Error(`File must be PROCESSING to mark as COMPLETED`);
    }
    this.status = FileStatus. COMPLETED;
    this.processedAt = new Date();
    if (hash) {
      this.hash = hash;
    }
    if (metadata) {
      this.metadata = { ...this.metadata, ...metadata };
    }
  }

  markAsFailed(reason: string): void {
    this.status = FileStatus.FAILED;
    this.failureReason = reason;
  }

  updateSize(sizeInBytes: number): void {
    if (sizeInBytes < 0) {
      throw new Error('File size cannot be negative');
    }
    this.sizeInBytes = sizeInBytes;
  }

  canBeProcessed(): boolean {
    return this.status === FileStatus. PENDING && !!this.sizeInBytes;
  }

  isCompleted(): boolean {
    return this.status === FileStatus.COMPLETED;
  }

  hasFailed(): boolean {
    return this.status === FileStatus. FAILED;
  }

  getFormattedSize(): string {
    if (!this.sizeInBytes) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = this.sizeInBytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  isImage(): boolean {
    return this.mimeType?. startsWith('image/') ??  false;
  }

  isVideo(): boolean {
    return this.mimeType?.startsWith('video/') ?? false;
  }
}