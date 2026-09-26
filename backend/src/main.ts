// Set Node.js timezone to UTC before any date modules load to fix 3-hour offset
process.env.TZ = 'UTC';
import * as pg from 'pg';
pg.types.setTypeParser(1114, str => new Date(str + 'Z'));

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as fs from 'fs';
import * as express from 'express';
import helmet from 'helmet';

import * as compression from 'compression';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    
    // HTTP sıkıştırması (Bandwidth tasarrufu sağlar)
    app.use(compression());

    // Enable shutdown hooks to ensure TypeORM closes connections on hot-reload/restart
    app.enableShutdownHooks();

    // Security headers
    app.use(helmet({
        crossOriginOpenerPolicy: { policy: "unsafe-none" }, // Changed for popup communication
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginEmbedderPolicy: false
    }));

    // Body parser limits
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    // Serve uploaded files statically (no /api prefix for static assets)
    const uploadsPath = join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
    }
    // Önbellekleme (Caching) eklenerek bandwidth tüketimi düşürüldü
    app.useStaticAssets(uploadsPath, { 
        prefix: '/uploads/',
        maxAge: 31536000000 // 1 yıl cache (ms cinsinden)
    });

    // Global prefix for all routes
    app.setGlobalPrefix(process.env.API_PREFIX || 'api');

    // Enable CORS with more flexible origin matching
    const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
    const allowedOrigins = [
        'https://uni-verse-uygulama-web.vercel.app',
        'https://uni-verse-uygulama-mobil.vercel.app',
        'https://bondlecommunity.com',
        'https://www.bondlecommunity.com',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://localhost',    // Capacitor Android
        'http://localhost',     // Capacitor Android fallback
        ...envOrigins
    ];

    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || 
                allowedOrigins.includes(origin) || 
                origin.endsWith('.vercel.app') || 
                origin.includes('localhost')) {
                callback(null, true);
            } else {
                console.warn(`CORS blocked for origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Access-Control-Allow-Origin'],
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    // Global serialization interceptor
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

    // Swagger API Documentation (only in development)
    if (process.env.NODE_ENV !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('UniVerse API')
            .setDescription('UniVerse Community Platform Backend API')
            .setVersion('1.0')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    name: 'JWT',
                    description: 'Enter JWT token',
                    in: 'header',
                },
                'JWT-auth',
            )
            .addTag('Authentication', 'Auth endpoints')
            .addTag('Users', 'User management')
            .addTag('Events', 'Events management')
            .addTag('Clubs', 'Clubs and communities')
            .addTag('Networking', 'Networking and matching')
            .addTag('Credits', 'Credits system')
            .addTag('Feedback', 'User feedback')
            .addTag('Admin', 'Admin operations')
            .addTag('Premium', 'Premium membership')
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);
    }

    const port = process.env.PORT || 3001;
    const host = process.env.HOST || '0.0.0.0';

    console.log('🔍 DEBUG - PORT:', port);
    console.log('🔍 DEBUG - HOST:', host);
    console.log('🔍 DEBUG - NODE_ENV:', process.env.NODE_ENV);

    await app.listen(port, host);

    console.log(`🚀 UniVerse Backend API running on: http://localhost:${port}/api`);
    console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();

// Trigger restart at 23:39
