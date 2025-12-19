import { Migration } from '@mikro-orm/migrations';

export class Migration20251219153504_add_thumbnails_to_files extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "files" add column "thumbnails" jsonb null;`);
    this.addSql(`alter table "files" alter column "hash" type varchar(64) using ("hash"::varchar(64));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "files" drop column "thumbnails";`);

    this.addSql(`alter table "files" alter column "hash" type varchar(255) using ("hash"::varchar(255));`);
  }

}
