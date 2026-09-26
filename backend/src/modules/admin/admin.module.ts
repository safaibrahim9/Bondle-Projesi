import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { User } from '../users/entities/user.entity';
import { EventsModule } from '../events/events.module';
import { AuthModule } from '../auth/auth.module';
import { CreditsModule } from '../credits/credits.module';

import { AbuseModule } from '../abuse/abuse.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [TypeOrmModule.forFeature([User]), EventsModule, AuthModule, CreditsModule, AbuseModule, AuditLogModule, UsersModule],
    controllers: [AdminController],
})
export class AdminModule { }
