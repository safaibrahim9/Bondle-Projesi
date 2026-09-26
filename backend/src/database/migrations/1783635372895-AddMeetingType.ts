import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMeetingType1783635372895 implements MigrationInterface {
    name = 'AddMeetingType1783635372895'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meetings" ADD "meetingType" character varying(50) NOT NULL DEFAULT 'networking'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meetings" DROP COLUMN "meetingType"`);
    }

}
