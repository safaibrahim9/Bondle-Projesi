import { MigrationInterface, QueryRunner } from "typeorm";

export class EventMessages1784681108033 implements MigrationInterface {
    name = 'EventMessages1784681108033'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "event_messages" ("id" SERIAL NOT NULL, "content" text NOT NULL, "event_id" integer NOT NULL, "user_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c7284d8b3497760777fc53e76b0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "event_messages" ADD CONSTRAINT "FK_a0c503806e4e307c76b6d59e114" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_messages" ADD CONSTRAINT "FK_1b8c694277bab9a9cdc3f6b1a54" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_messages" DROP CONSTRAINT "FK_1b8c694277bab9a9cdc3f6b1a54"`);
        await queryRunner.query(`ALTER TABLE "event_messages" DROP CONSTRAINT "FK_a0c503806e4e307c76b6d59e114"`);
        await queryRunner.query(`DROP TABLE "event_messages"`);
    }

}
