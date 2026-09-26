import { MigrationInterface, QueryRunner } from "typeorm";

export class EventMessageAdvancedFeatures1784682338641 implements MigrationInterface {
    name = 'EventMessageAdvancedFeatures1784682338641'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_messages" ADD "is_edited" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "event_messages" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "event_messages" ADD "reply_to_id" integer`);
        await queryRunner.query(`ALTER TABLE "event_messages" ADD "is_poll" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "event_messages" ADD "poll_options" jsonb`);
        await queryRunner.query(`ALTER TABLE "event_messages" ADD "poll_votes" jsonb`);
        await queryRunner.query(`ALTER TABLE "event_messages" ADD CONSTRAINT "FK_5c396ae8432f885a161519769fb" FOREIGN KEY ("reply_to_id") REFERENCES "event_messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_messages" DROP CONSTRAINT "FK_5c396ae8432f885a161519769fb"`);
        await queryRunner.query(`ALTER TABLE "event_messages" DROP COLUMN "poll_votes"`);
        await queryRunner.query(`ALTER TABLE "event_messages" DROP COLUMN "poll_options"`);
        await queryRunner.query(`ALTER TABLE "event_messages" DROP COLUMN "is_poll"`);
        await queryRunner.query(`ALTER TABLE "event_messages" DROP COLUMN "reply_to_id"`);
        await queryRunner.query(`ALTER TABLE "event_messages" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "event_messages" DROP COLUMN "is_edited"`);
    }

}
