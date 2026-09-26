import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { Announcement } from './entities/announcement.entity';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../../common/services/cloudinary.module';
import { ClubsModule } from '../clubs/clubs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Announcement]),
        AuthModule,
        CloudinaryModule,
        ClubsModule,
    ],
    controllers: [AnnouncementsController],
    providers: [AnnouncementsService],
    exports: [AnnouncementsService],
})
export class AnnouncementsModule { }
