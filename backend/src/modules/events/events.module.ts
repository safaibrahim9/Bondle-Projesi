import { AuthModule } from '../auth/auth.module';
import { EmailService } from '../../common/services/email.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { EventSpeaker } from './entities/event-speaker.entity';
import { EventTopic } from './entities/event-topic.entity';
import { EventRegistration } from './entities/event-registration.entity';
import { EventFeedback } from './entities/event-feedback.entity';
import { EventMessage } from './entities/event-message.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { CreditsModule } from '../credits/credits.module';
import { EngagementModule } from '../engagement/engagement.module';
import { ClubsModule } from '../clubs/clubs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Event,
            EventSpeaker,
            EventTopic,
            EventRegistration,
            EventFeedback,
            EventMessage,
            User,
        ]),
        CreditsModule,
        AuthModule,
        NotificationsModule,
        UsersModule,
        EngagementModule,
        ClubsModule,
    ],
    controllers: [EventsController],
    providers: [EventsService, EmailService],
    exports: [EventsService],
})
export class EventsModule { }
