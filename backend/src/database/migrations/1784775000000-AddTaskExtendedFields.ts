import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaskExtendedFields1784775000000 implements MigrationInterface {
    name = 'AddTaskExtendedFields1784775000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "dueDate" timestamp NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "pinnedMessage" text NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "pinnedLink" varchar(2048) NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN IF EXISTS "dueDate"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN IF EXISTS "pinnedMessage"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN IF EXISTS "pinnedLink"`);
    }
}
