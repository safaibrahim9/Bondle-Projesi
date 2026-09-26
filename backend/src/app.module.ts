import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { typeOrmConfig } from './config/typeorm.config';
import { validate } from './config/env.validation';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EventsModule } from './modules/events/events.module';
import { CreditsModule } from './modules/credits/credits.module';
import { AdminModule } from './modules/admin/admin.module';
import { NetworkingModule } from './modules/networking/networking.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { ClubsModule } from './modules/clubs/clubs.module';
import { PremiumModule } from './modules/premium/premium.module';
import { MentorshipModule } from './modules/mentorship/mentorship.module';
import { CompetitionsModule } from './modules/competitions/competitions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadModule } from './modules/upload/upload.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AbuseModule } from './modules/abuse/abuse.module';
import { EngagementModule } from './modules/engagement/engagement.module';
import { CommunityModule } from './modules/community/community.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AiModule } from './common/services/ai.module';
import { SeedService } from './database/seed.service';
import { User } from './modules/users/entities/user.entity';
import { Announcement } from './modules/announcements/entities/announcement.entity';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { Task } from './modules/tasks/entities/task.entity';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
    imports: [
        // Configuration module
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            validate,
        }),

        // Database module
        TypeOrmModule.forRootAsync({
            useFactory: typeOrmConfig,
        }),

        // Schedule module for cron jobs (credit reset)
        ScheduleModule.forRoot(),

        // Feature modules
        AuthModule,
        UsersModule,
        EventsModule,
        CreditsModule,
        AdminModule,
        NetworkingModule,
        FeedbackModule,
        ClubsModule,
        PremiumModule,
        MentorshipModule,
        CompetitionsModule,
        NotificationsModule,
        UploadModule,
        AnnouncementsModule,
        AuditLogModule,
        AbuseModule,
        EngagementModule,
        CommunityModule,
        ProjectsModule,
        AiModule,
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100,
        }]),
        TypeOrmModule.forFeature([User, Announcement, Task]),
        AnalyticsModule,
        TasksModule,
    ],
    providers: [
        // Global exception filter
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
        // Global logging interceptor
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
        },
        // Global rate limiting guard
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        SeedService,
        RolesGuard,
    ],
})
// Trigger recompile for CommunityModule registration
export class AppModule { }
