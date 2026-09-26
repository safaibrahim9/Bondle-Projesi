import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitionsController } from './competitions.controller';
import { CompetitionsService } from './competitions.service';
import { Competition } from './entities/competition.entity';
import { CompetitionSubmission } from './entities/competition-submission.entity';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Competition, CompetitionSubmission]),
        AuthModule,
        NotificationsModule,
    ],
    controllers: [CompetitionsController],
    providers: [CompetitionsService],
    exports: [CompetitionsService],
})
export class CompetitionsModule { }

