import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import {
    CreateEventFeedbackDto,
    CreateGeneralFeedbackDto,
} from './dto/feedback.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Feedback')
@Controller('feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class FeedbackController {
    constructor(private readonly feedbackService: FeedbackService) { }

    @Post('event')
    @ApiOperation({ summary: 'Submit event feedback (one per user per event)' })
    async createEventFeedback(
        @CurrentUser() user: any,
        @Body() dto: CreateEventFeedbackDto,
    ) {
        return this.feedbackService.createEventFeedback(
            user.sub,
            dto.eventId,
            dto.rating,
            dto.comment,
        );
    }

    @Post('general')
    @ApiOperation({ summary: 'Submit general platform feedback' })
    async createGeneralFeedback(
        @CurrentUser() user: any,
        @Body() dto: CreateGeneralFeedbackDto,
    ) {
        return this.feedbackService.createGeneralFeedback(
            user.sub,
            dto.rating,
            dto.comment,
        );
    }

    @Get('event/:eventId')
    @ApiOperation({ summary: 'Get all feedback for an event' })
    async getEventFeedback(@Param('eventId') eventId: string) {
        return this.feedbackService.getEventFeedback(+eventId);
    }

    @Get('event/:eventId/average')
    @ApiOperation({ summary: 'Get average rating for an event' })
    async getAverageRating(@Param('eventId') eventId: string) {
        const average = await this.feedbackService.getAverageRating(+eventId);
        return { eventId: +eventId, averageRating: average };
    }

    @Get('my')
    @ApiOperation({ summary: 'Get my feedback history' })
    async getMyFeedback(@CurrentUser() user: any) {
        return this.feedbackService.getMyFeedback(user.sub);
    }

    @Get('general/all')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all general feedback (Admin only)' })
    async getAllGeneralFeedback() {
        return this.feedbackService.getAllGeneralFeedback();
    }
}
