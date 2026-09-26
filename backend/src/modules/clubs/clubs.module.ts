import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ClubsController } from './clubs.controller';
import { ClubsService } from './clubs.service';
import { Club } from './entities/club.entity';
import { ClubMember } from './entities/club-member.entity';
import { ClubGalleryImage } from './entities/club-gallery-image.entity';
import { ClubMemberScore } from './entities/club-member-score.entity';
import { ClubMemberScoreLog } from './entities/club-member-score-log.entity';
import { CloudinaryService } from '../../common/services/cloudinary.service';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { EngagementModule } from '../engagement/engagement.module';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Club, ClubMember, ClubGalleryImage, User, ClubMemberScore, ClubMemberScoreLog]),
        AuthModule,
        NotificationsModule,
        EngagementModule,
    ],
    controllers: [ClubsController],
    providers: [ClubsService, CloudinaryService, OptionalJwtAuthGuard],
    exports: [ClubsService],
})
export class ClubsModule { }
