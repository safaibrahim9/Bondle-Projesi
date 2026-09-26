import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Query,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../common/enums';
import { EngagementService } from '../engagement/engagement.service';

@ApiTags('Events')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class EventsController {
    constructor(
        private readonly eventsService: EventsService,
        private readonly engagementService: EngagementService
    ) { }

    @Public()
    @Get()
    @ApiOperation({ summary: 'Get all approved events' })
    async findAll(
        @Query('city') city?: string,
        @Query('clubId') clubId?: string,
        @CurrentUser() user?: any
    ) {
        if (user?.sub) {
            await this.engagementService.completeDailyGoal(user.sub, 'view_events');
        }
        return this.eventsService.findAll({ 
            city, 
            clubId: clubId ? parseInt(clubId) : undefined 
        });
    }

    @Get('ai-recommendations')
    @ApiOperation({ summary: 'Get AI powered event recommendations' })
    async getAiRecommendations(@CurrentUser() user: any) {
        return this.eventsService.getAiRecommendations(user.sub);
    }

    @Get('my-registrations')
    @ApiOperation({ summary: 'Get my event registrations' })
    async getMyRegistrations(@CurrentUser() user: any) {
        try {
            console.log(`[EventsController] Fetching registrations for user: ${user.sub}`);
            const registrations = await this.eventsService.getUserRegistrations(user.sub);
            return registrations;
        } catch (error) {
            console.error('[EventsController] Error fetching registrations:', error);
            // Return empty array on error to prevent app crash
            return [];
        }
    }

    @Get('registrations/pending')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.USER, UserRole.CAMPUS_AMBASSADOR)
    @ApiOperation({ summary: 'Get all pending registrations (Admin only)' })
    async getPendingRegistrations(@CurrentUser() user: any) {
        if (user.role === UserRole.ADMIN) {
            return this.eventsService.getAllPendingRegistrations();
        }
        // Feature: Filter pending registrations by branch for branch reps if needed later
        // For now, return empty array to prevent 403 on the admin dashboard
        return [];
    }

    @Get('feedbacks/all')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all feedbacks (Admin only)' })
    async getAllFeedbacks() {
        return this.eventsService.getAllFeedbacks();
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get event by ID' })
    async findOne(@Param('id') id: string) {
        return this.eventsService.findOne(+id);
    }

    @Post()
    @ApiOperation({ summary: 'Create new event (Admin or Club Official)' })
    async create(
        @CurrentUser() user: any,
        @Body() createEventDto: CreateEventDto,
    ) {
        return this.eventsService.create(createEventDto, user.sub, user.role);
    }

    @Post(':id/register')
    @ApiOperation({ summary: 'Register for an event' })
    async registerForEvent(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() data?: any,
    ) {
        return this.eventsService.registerForEvent(+id, user.sub, data);
    }

    @Post(':id/admin/add-participant')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.CLUB_PRESIDENT)
    @ApiOperation({ summary: 'Manually add a participant to an event (Admin/Club Official)' })
    async adminAddParticipant(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body('email') email: string,
    ) {
        if (!email) {
            throw new BadRequestException('E-posta adresi gereklidir.');
        }
        return this.eventsService.adminAddParticipant(+id, user.sub, email);
    }

    @Public()
    @Get(':id/messages')
    @ApiOperation({ summary: 'Get chat messages for an event' })
    async getEventMessages(@Param('id') id: string) {
        return this.eventsService.getEventMessages(+id);
    }

    @Post(':id/messages')
    @ApiOperation({ summary: 'Post a chat message to an event' })
    async postEventMessage(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() data: { content: string, replyToId?: number, isPoll?: boolean, pollOptions?: any }
    ) {
        if (!data.content || !data.content.trim()) {
            throw new BadRequestException('Message content cannot be empty');
        }
        return this.eventsService.postEventMessage(+id, user.sub, data.content, data.replyToId, data.isPoll, data.pollOptions);
    }

    @Put(':id/messages/:messageId')
    @ApiOperation({ summary: 'Edit a chat message' })
    async editEventMessage(
        @Param('messageId') messageId: string,
        @CurrentUser() user: any,
        @Body('content') content: string,
    ) {
        if (!content || !content.trim()) {
            throw new BadRequestException('Message content cannot be empty');
        }
        return this.eventsService.editEventMessage(+messageId, user.sub, content);
    }

    @Delete(':id/messages/:messageId')
    @ApiOperation({ summary: 'Delete a chat message' })
    async deleteEventMessage(
        @Param('messageId') messageId: string,
        @CurrentUser() user: any,
    ) {
        return this.eventsService.deleteEventMessage(+messageId, user.sub);
    }

    @Post(':id/messages/:messageId/vote')
    @ApiOperation({ summary: 'Vote on a poll message' })
    async votePoll(
        @Param('messageId') messageId: string,
        @CurrentUser() user: any,
        @Body('optionIds') optionIds: number[],
    ) {
        if (!Array.isArray(optionIds)) {
            throw new BadRequestException('optionIds must be an array');
        }
        return this.eventsService.votePoll(+messageId, user.sub, optionIds);
    }

    @Delete(':id/unregister')
    @ApiOperation({ summary: 'Unregister from event' })
    async unregister(@Param('id') id: string, @CurrentUser() user: any) {
        return this.eventsService.unregisterFromEvent(+id, user.sub);
    }

    @Post(':id/check-in')
    @ApiOperation({ summary: 'Check in a user via QR code' })
    async checkInUser(
        @Param('id') eventId: string,
        @Body('userId') userId: number,
        @CurrentUser() user: any,
    ) {
        return this.eventsService.checkInUser(+eventId, userId, user.sub);
    }



    @Post(':id/report-payment')
    @ApiOperation({ summary: 'Report payment as completed' })
    async reportPayment(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ) {
        return this.eventsService.reportPayment(+id, user.sub);
    }

    @Post(':id/feedback')
    @ApiOperation({ summary: 'Submit event feedback' })
    async submitFeedback(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() createFeedbackDto: any,
    ) {
        return this.eventsService.submitFeedback(+id, user.sub, createFeedbackDto);
    }



    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update event' })
    async update(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() updateEventDto: UpdateEventDto,
    ) {
        return this.eventsService.updateEvent(+id, updateEventDto, user.sub, user.role);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Delete event' })
    async remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.eventsService.deleteEvent(+id, user.sub, user.role);
    }

    @Put(':id/toggle-global')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Toggle event global visibility (Admin only)' })
    async toggleGlobal(@Param('id') id: string) {
        return this.eventsService.toggleGlobal(+id);
    }



    @Get(':id/registrations')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get registrations for a specific event' })
    async getEventRegistrations(@Param('id') id: string, @CurrentUser() user: any) {
        return this.eventsService.getEventRegistrations(+id, user.sub, user.role);
    }

    @Post('registrations/:regId/verify')
    @ApiOperation({ summary: 'Verify event registration (Admin or Club Official)' })
    async verifyRegistration(
        @Param('regId') regId: string,
        @CurrentUser() user: any,
    ) {
        return this.eventsService.verifyRegistration(+regId, user.sub, user.role);
    }

    @Post('registrations/:regId/reject')
    @ApiOperation({ summary: 'Reject event registration (Admin or Club Official)' })
    async rejectRegistration(
        @Param('regId') regId: string,
        @CurrentUser() user: any,
    ) {
        return this.eventsService.rejectRegistration(+regId, user.sub, user.role);
    }
    @Get('test-email/:eventId/:senderId')
    @ApiOperation({ summary: 'Test email logic for an event message' })
    async testEmailLogic(
        @Param('eventId') eventId: string,
        @Param('senderId') senderId: string,
    ) {
        return this.eventsService.testEmailLogic(+eventId, +senderId);
    }
}
