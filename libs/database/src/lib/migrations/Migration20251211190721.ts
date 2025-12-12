import { Migration } from '@mikro-orm/migrations';

export class Migration20251211190721 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "files" ("id" uuid not null, "name" varchar(255) not null, "storage_key" varchar(255) not null, "status" text check ("status" in ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')) not null default 'PENDING', "mime_type" varchar(255) not null, "size_in_bytes" bigint null, "hash" varchar(255) null, "metadata" jsonb null, "failure_reason" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "processed_at" timestamptz null, constraint "files_pkey" primary key ("id"));`);
    this.addSql(`alter table "files" add constraint "files_storage_key_unique" unique ("storage_key");`);

    this.addSql(`create table "processing_logs" ("id" uuid not null, "message" varchar(255) not null, "details" jsonb null, "created_at" timestamptz not null, "file_id" uuid not null, constraint "processing_logs_pkey" primary key ("id"));`);

    this.addSql(`alter table "processing_logs" add constraint "processing_logs_file_id_foreign" foreign key ("file_id") references "files" ("id") on update cascade on delete cascade;`);
  }

}
