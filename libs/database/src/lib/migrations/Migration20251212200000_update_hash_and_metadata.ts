import { Migration } from '@mikro-orm/migrations';

export class Migration20251212200000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "files" 
      ADD COLUMN IF NOT EXISTS "hash" VARCHAR(64),
      ADD COLUMN IF NOT EXISTS "metadata" JSONB;
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "files" 
      DROP COLUMN IF EXISTS "hash",
      DROP COLUMN IF EXISTS "metadata";
    `);
  }
}