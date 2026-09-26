import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserEntity1783552900659 implements MigrationInterface {
    name = 'UpdateUserEntity1783552900659'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "refreshToken" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refreshToken"`);
    }

}
