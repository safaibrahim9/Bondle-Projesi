import { DataSource } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();
process.env.TZ = 'UTC';
import * as pg from 'pg';
pg.types.setTypeParser(1114, str => new Date(str + 'Z'));

export const AppDataSource = new DataSource(
    process.env.DATABASE_URL
        ? {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [join(__dirname, '/../**/*.entity{.ts,.js}')],
            migrations: [join(__dirname, '/migrations/*{.ts,.js}')],
            synchronize: true,
            logging: true,
            ssl: {
                rejectUnauthorized: false, // Required for most cloud DBs like Supabase/Railway
            },
        }
        : {
            type: 'postgres',
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
            username: process.env.DATABASE_USER || 'universe_user',
            password: process.env.DATABASE_PASSWORD || 'universe_pass',
            database: process.env.DATABASE_NAME || 'universe_db',
            entities: [join(__dirname, '/../**/*.entity{.ts,.js}')],
            migrations: [join(__dirname, '/migrations/*{.ts,.js}')],
            synchronize: false,
            logging: true,
        },
);
