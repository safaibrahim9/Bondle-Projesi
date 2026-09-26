import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Query,
    Request,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CommunityService } from './community.service';
import { EngagementService } from '../engagement/engagement.service';

@Controller('community')
export class CommunityController {
    constructor(
        private readonly communityService: CommunityService,
        private readonly engagementService: EngagementService
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post('posts')
    @UseInterceptors(FileInterceptor('file'))
    async createPost(
        @CurrentUser() user,
        @Body('content') content: string,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
                ],
                fileIsRequired: false,
            }),
        ) file: Express.Multer.File,
        @Body('clubId') clubId?: number,
        @Body('eventId') eventId?: number,
        @Body('type') type?: string,
    ) {
        if (file && !file.mimetype.startsWith('image/')) {
            throw new BadRequestException(`Invalid file type: ${file.mimetype}. Only images are allowed.`);
        }
        const post = await this.communityService.createPost(user.sub, content, file, clubId, eventId, type);
        // Track daily goal
        await this.engagementService.completeDailyGoal(user.sub, 'create_post');
        return post;
    }

    @UseGuards(JwtAuthGuard)
    @Put('posts/:id')
    async updatePost(
        @Param('id') id: number,
        @CurrentUser() user,
        @Body('content') content: string
    ) {
        return this.communityService.updatePost(id, user.sub, content);
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get('feed')
    async getFeed(
        @CurrentUser() user,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number
    ) {
        return this.communityService.getFeed(user?.sub, limit, offset);
    }

    @UseGuards(JwtAuthGuard)
    @Post('posts/:id/like')
    async toggleLike(@Param('id') id: number, @CurrentUser() user) {
        return this.communityService.toggleLike(id, user.sub);
    }

    @Get('posts/:id/likes')
    async getPostLikes(@Param('id') id: number) {
        return this.communityService.getPostLikes(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('posts/:id/comments')
    async addComment(
        @Param('id') id: number,
        @CurrentUser() user,
        @Body('content') content: string
    ) {
        return this.communityService.addComment(id, user.sub, content);
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get('posts/:id/comments')
    async getPostComments(@Param('id') id: number, @CurrentUser() user) {
        return this.communityService.getPostComments(id, user?.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Post('comments/:id/like')
    async toggleCommentLike(@Param('id') id: number, @CurrentUser() user) {
        return this.communityService.toggleCommentLike(id, user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('posts/:id')
    async deletePost(@Param('id') id: number, @CurrentUser() user) {
        return this.communityService.deletePost(id, user.sub, user.role);
    }
}
