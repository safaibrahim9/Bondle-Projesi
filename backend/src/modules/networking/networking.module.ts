import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NetworkingController } from './networking.controller';
import { NetworkingService } from './networking.service';
import { NetworkingMatch } from './entities/networking-match.entity';
import { Connection } from './entities/connection.entity';
import { Meeting } from './entities/meeting.entity';
import { MeetingEvent } from './entities/meeting-event.entity';
import { CreditsModule } from '../credits/credits.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AbuseModule } from '../abuse/abuse.module';
import { User } from '../users/entities/user.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { EngagementModule } from '../engagement/engagement.module';
import { UserStreak } from '../engagement/entities/user-streak.entity';
import { UserBlock } from '../abuse/entities/user-block.entity';
import { EmailService } from '../../common/services/email.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([NetworkingMatch, Connection, Meeting, MeetingEvent, User, UserStreak, UserBlock]),
        CreditsModule,
        UsersModule,
        AuthModule,
        NotificationsModule,
        AbuseModule,
        AuditLogModule,
        EngagementModule,
    ],
    controllers: [NetworkingController],
    providers: [NetworkingService, EmailService],
    exports: [NetworkingService],
})
export class NetworkingModule { }
