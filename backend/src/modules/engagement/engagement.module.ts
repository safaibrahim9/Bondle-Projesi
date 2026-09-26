import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EngagementService } from './engagement.service';
import { EngagementController } from './engagement.controller';
import { UserStreak } from './entities/user-streak.entity';
import { UserBadge } from './entities/user-badge.entity';
import { WeeklyChallengeCompletion } from './entities/weekly-challenge-completion.entity';
import { DailyAnswer } from './entities/daily-answer.entity';
import { CreditsModule } from '../credits/credits.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/entities/user.entity';
import { Credit } from '../credits/entities/credit.entity';
import { Connection } from '../networking/entities/connection.entity';
import { Event } from '../events/entities/event.entity';
import { MentorshipProgram } from '../mentorship/entities/mentorship-program.entity';
import { Competition } from '../competitions/entities/competition.entity';
import { EventRegistration } from '../events/entities/event-registration.entity';
import { ClubMember } from '../clubs/entities/club-member.entity';
import { MentorshipApplication } from '../mentorship/entities/mentorship-application.entity';
import { CompetitionSubmission } from '../competitions/entities/competition-submission.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserStreak, 
            UserBadge, 
            WeeklyChallengeCompletion, 
            DailyAnswer,
            User, 
            Credit, 
            Connection,
            Event,
            MentorshipProgram,
            Competition,
            EventRegistration,
            ClubMember,
            MentorshipApplication,
            CompetitionSubmission
        ]),
        CreditsModule,
        NotificationsModule,
        AuthModule,
    ],
    controllers: [EngagementController],
    providers: [EngagementService],
    exports: [EngagementService],
})
export class EngagementModule { }
