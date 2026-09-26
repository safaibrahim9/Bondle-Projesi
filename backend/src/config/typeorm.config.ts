import { TypeOrmModuleOptions } from '@nestjs/typeorm';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export const typeOrmConfig = (): TypeOrmModuleOptions => {
    // Production: Use PostgreSQL from DATABASE_URL (Supabase)
    if (process.env.DATABASE_URL) {
        return {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
            migrationsRun: false, // Disabled: columns are managed by onModuleInit instead
            synchronize: false, // SECURITY: Never use true in production
            logging: false,
            autoLoadEntities: true,
            retryAttempts: 10,
            retryDelay: 3000,
            ssl: {
                rejectUnauthorized: false, // Required for Supabase
            },
            extra: {
                ssl: {
                    rejectUnauthorized: false,
                },
                max: 15, // Limit pool size
                idleTimeoutMillis: 10000, // Close idle connections quickly to prevent leaks on hot-reload
                connectionTimeoutMillis: 5000,
            },
        };
    }

    // Development: Use SQLite
    return {
        type: 'sqlite',
        database: process.env.DATABASE_PATH || './data/universe.db',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        // In local/dev SQLite, keep schema in sync with entities.
        // Many flows (events registrations, premium, etc.) depend on newly added columns.
        synchronize: process.env.TYPEORM_SYNCHRONIZE
            ? process.env.TYPEORM_SYNCHRONIZE === 'true'
            : true,
        logging: process.env.NODE_ENV === 'development',
    };
};
