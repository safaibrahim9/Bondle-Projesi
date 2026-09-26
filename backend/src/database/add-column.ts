import { createConnection } from 'typeorm';
import { typeOrmConfig } from '../config/typeorm.config';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function run() {
    const config = typeOrmConfig() as any;
    const connection = await createConnection({
        ...config,
        entities: [path.join(__dirname, '../modules/**/*.entity{.ts,.js}')]
    });

    try {
        const queryRunner = connection.createQueryRunner();
        console.log('Adding column requiresForm to events table...');
        await queryRunner.query('ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "requiresForm" BOOLEAN DEFAULT FALSE');
        console.log('Column added successfully!');
    } catch (err) {
        console.error('Error adding column:', err.message);
    } finally {
        await connection.close();
    }
}

run();
