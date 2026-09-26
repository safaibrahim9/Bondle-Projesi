import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NetworkingService } from './networking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EngagementService } from '../engagement/engagement.service';
import { Ip } from '@nestjs/common';

@ApiTags('Networking')
@Controller('networking')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NetworkingController {
    constructor(
        private readonly networkingService: NetworkingService,
        private readonly engagementService: EngagementService
    ) { }

    @Post('match/:targetUserId')
    @ApiOperation({ summary: 'Create networking match (max 2 per user pair)' })
    async createMatch(
        @CurrentUser() user: any,
        @Param('targetUserId') targetUserId: string,
    ) {
        const result = await this.networkingService.createMatch(user.sub, +targetUserId);
        await this.engagementService.completeDailyGoal(user.sub, 'send_connection');
        return result;
    }

    @Post('matches/:matchId/accept')
    @ApiOperation({ summary: 'Accept networking match' })
    async acceptMatch(
        @CurrentUser() user: any,
        @Param('matchId') matchId: string,
    ) {
        return this.networkingService.acceptMatch(+matchId, user.sub);
    }

    @Post('matches/:matchId/reject')
    @ApiOperation({ summary: 'Reject networking match' })
    async rejectMatch(
        @CurrentUser() user: any,
        @Param('matchId') matchId: string,
    ) {
        return this.networkingService.rejectMatch(+matchId, user.sub);
    }

    @Delete('matches/:matchId/cancel')
    @ApiOperation({ summary: 'Cancel sent connection request' })
    async cancelMatch(
        @CurrentUser() user: any,
        @Param('matchId') matchId: string,
    ) {
        return this.networkingService.cancelMatch(+matchId, user.sub);
    }

    @Get('matches')
    @ApiOperation({ summary: 'Get my networking matches' })
    async getMyMatches(@CurrentUser() user: any) {
        return this.networkingService.getMyMatches(user.sub);
    }

    @Get('connections')
    @ApiOperation({ summary: 'Get my connections' })
    async getMyConnections(@CurrentUser() user: any) {
        return this.networkingService.getMyConnections(user.sub);
    }

    @Get('ai-suggestions')
    @ApiOperation({ summary: 'Get AI-powered suggested users with reasons' })
    async getAiSuggestions(@CurrentUser() user: any) {
        return this.networkingService.getAiSuggestions(user.sub);
    }

    @Get('suggestions')
    @ApiOperation({ summary: 'Get suggested users for networking (excludes connections)' })
    async getSuggestions(@CurrentUser() user: any, @Query('search') search?: string) {
        return this.networkingService.getSuggestions(user.sub, search);
    }

    @Get('history/:targetUserId')
    @ApiOperation({ summary: 'Get match history with specific user' })
    async getMatchHistory(
        @CurrentUser() user: any,
        @Param('targetUserId') targetUserId: string,
    ) {
        return this.networkingService.getMatchHistory(user.sub, +targetUserId);
    }

    @Get('requests/incoming')
    @ApiOperation({ summary: 'Get incoming connection requests' })
    async getIncomingRequests(@CurrentUser() user: any) {
        return this.networkingService.getIncomingRequests(user.sub);
    }

    @Post('meetings')
    @ApiOperation({ summary: 'Schedule meeting with connection (deducts 1 credit)' })
    async scheduleMeeting(
        @CurrentUser() user: any,
        @Body() meetingData: {
            connectionId: number;
            scheduledDate: Date;
            location?: string;
            isOnline: boolean;
            zoomLink?: string;
            notes?: string;
            motivation?: string;
        },
    ) {
        return this.networkingService.scheduleMeeting(
            user.sub,
            meetingData.connectionId,
            meetingData,
        );
    }

    @Post('meetings/direct')
    @ApiOperation({ summary: 'Schedule a direct meeting with any user by userId (deducts 1 credit)' })
    async scheduleMeetingDirect(
        @CurrentUser() user: any,
        @Body() meetingData: {
            targetUserId: number;
            scheduledDate: Date;
            location?: string;
            isOnline: boolean;
            zoomLink?: string;
            notes?: string;
            motivation?: string;
        },
    ) {
        return this.networkingService.scheduleMeetingDirect(
            user.sub,
            meetingData.targetUserId,
            meetingData,
        );
    }

    @Get('meetings/pending/incoming')
    @ApiOperation({ summary: 'Get incoming meeting requests' })
    async getIncomingMeetings(@CurrentUser() user: any) {
        return this.networkingService.getPendingMeetings(user.sub, 'incoming');
    }

    @Get('meetings/pending/outgoing')
    @ApiOperation({ summary: 'Get outgoing meeting requests' })
    async getOutgoingMeetings(@CurrentUser() user: any) {
        return this.networkingService.getPendingMeetings(user.sub, 'outgoing');
    }

    @Get('meetings')
    @ApiOperation({ summary: 'Get my upcoming meetings' })
    async getMyMeetings(@CurrentUser() user: any) {
        return this.networkingService.getUserMeetings(user.sub);
    }

    @Get('meetings/:id')
    @ApiOperation({ summary: 'Get meeting by ID (for joining video call)' })
    async getMeetingById(
        @CurrentUser() user: any,
        @Param('id') id: string,
    ) {
        return this.networkingService.getMeetingById(+id, user.sub);
    }

    @Get('meetings/:id/token')
    @ApiOperation({ summary: 'Get Agora token for a meeting' })
    async getMeetingToken(
        @CurrentUser() user: any,
        @Param('id') id: string,
    ) {
        return this.networkingService.getMeetingToken(id, user.sub, user.name);
    }

    @Post('meetings/:id/accept')
    @ApiOperation({ summary: 'Accept a meeting request' })
    async acceptMeeting(
        @CurrentUser() user: any,
        @Param('id') id: string,
    ) {
        return this.networkingService.acceptMeeting(+id, user.sub);
    }

    @Post('meetings/:id/reject')
    @ApiOperation({ summary: 'Reject a meeting request' })
    async rejectMeeting(
        @CurrentUser() user: any,
        @Param('id') id: string,
    ) {
        return this.networkingService.rejectMeeting(+id, user.sub);
    }

    @Delete('meetings/:id/cancel')
    @ApiOperation({ summary: 'Cancel a scheduled meeting' })
    async cancelMeeting(
        @CurrentUser() user: any,
        @Param('id') id: string,
    ) {
        return this.networkingService.cancelMeeting(+id, user.sub);
    }

    @Post('meetings/:id/reschedule')
    @ApiOperation({ summary: 'Reschedule a meeting request' })
    async rescheduleMeeting(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body() data: { scheduledDate: Date; notes?: string },
    ) {
        return this.networkingService.rescheduleMeeting(+id, user.sub, data);
    }

    @Post('meetings/:id/complete')
    @ApiOperation({ summary: 'Mark a meeting as completed when time expires' })
    async completeMeeting(
        @CurrentUser() user: any,
        @Param('id') id: string,
    ) {
        if (id.startsWith('event-')) return { success: true };
        return this.networkingService.completeMeeting(+id, user.sub);
    }

    @Post('assign-admin')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin manually assigns a meeting between two or more users' })
    async assignMeetingByAdmin(
        @CurrentUser() admin: any,
        @Ip() ip: string,
        @Body() data: { participantIds: number[]; content: string; type: string; title?: string; durationLimit?: number; zoomLink?: string }
    ) {
        return this.networkingService.assignMeetingByAdmin(data, admin.sub, ip);
    }

    @Post('meetings/:id/log-event')
    @ApiOperation({ summary: 'Log meeting join/leave event' })
    async logMeetingEvent(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body() dto: { eventType: 'join' | 'leave' }
    ) {
        if (id.startsWith('event-')) return { success: true };
        return this.networkingService.logMeetingEvent(user.sub, +id, dto.eventType);
    }

    @Get('admin/meetings')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin gets all assigned meetings' })
    async getAllMeetingsForAdmin() {
        return this.networkingService.getAllMeetingsForAdmin();
    }

    @Delete('admin/meetings/:id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin deletes an assigned meeting' })
    async deleteMeetingByAdmin(@Param('id') id: string) {
        return this.networkingService.deleteMeetingByAdmin(+id);
    }

    @Post('admin/meetings/:id') // Using POST for update to avoid some CORS/method issues if they exist, but PUT is more standard. Let's use PUT and see. Actually user might prefer POST for simplicity. I'll use PUT.
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin updates an assigned meeting' })
    async updateMeetingByAdmin(
        @Param('id') id: string,
        @Body() data: any
    ) {
        return this.networkingService.updateMeetingByAdmin(+id, data);
    }
}
