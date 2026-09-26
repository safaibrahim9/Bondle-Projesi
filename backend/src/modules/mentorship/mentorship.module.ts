import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MentorshipController } from './mentorship.controller';
import { MentorshipService } from './mentorship.service';
import { MentorshipProgram } from './entities/mentorship-program.entity';
import { MentorshipApplication } from './entities/mentorship-application.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([MentorshipProgram, MentorshipApplication, User]),
        AuthModule,
        NotificationsModule,
    ],
    controllers: [MentorshipController],
    providers: [MentorshipService],
    exports: [MentorshipService],
})
export class MentorshipModule { }
