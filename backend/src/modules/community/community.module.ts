import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityPost } from './entities/community-post.entity';
import { CommunityLike } from './entities/community-like.entity';
import { CommunityComment } from './entities/community-comment.entity';
import { CommunityCommentLike } from './entities/community-comment-like.entity';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { CloudinaryService } from '../../common/services/cloudinary.service';
import { AuthModule } from '../auth/auth.module';
import { EngagementModule } from '../engagement/engagement.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([CommunityPost, CommunityLike, CommunityComment, CommunityCommentLike]),
        AuthModule,
        EngagementModule,
    ],
    providers: [CommunityService, CloudinaryService],
    controllers: [CommunityController],
    exports: [CommunityService],
})
export class CommunityModule {}
