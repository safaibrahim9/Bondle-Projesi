import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MentorshipService } from './mentorship.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Mentorship')
@Controller('mentorship')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MentorshipController {
    constructor(private readonly mentorshipService: MentorshipService) { }

    // ─── Programs (Public) ────────────────────────────────

    @Public()
    @Get('programs')
    @ApiOperation({ summary: 'Get all mentorship programs' })
    async getPrograms() {
        return this.mentorshipService.getPrograms();
    }

    @Public()
    @Get('programs/:id')
    @ApiOperation({ summary: 'Get program details' })
    async getProgram(@Param('id') id: string) {
        return this.mentorshipService.getProgramById(+id);
    }

    // ─── Applications (User) ──────────────────────────────

    @Post('programs/:id/apply')
    @ApiOperation({ summary: 'Apply to a mentorship program' })
    async apply(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body() body: { motivation: string; experience?: string; phone?: string; email?: string },
    ) {
        return this.mentorshipService.applyToProgram(user.sub, +id, body);
    }

    @Get('my-applications')
    @ApiOperation({ summary: 'Get my applications' })
    async getMyApplications(@CurrentUser() user: any) {
        return this.mentorshipService.getMyApplications(user.sub);
    }

    // ─── Admin ────────────────────────────────────────────

    @Post('programs')
    @ApiOperation({ summary: 'Create a mentorship program (Admin)' })
    async createProgram(@Body() body: any) {
        return this.mentorshipService.createProgram(body);
    }

    @Delete('programs/:id')
    @ApiOperation({ summary: 'Delete a mentorship program (Admin)' })
    async deleteProgram(@Param('id') id: string) {
        return this.mentorshipService.deleteProgram(+id);
    }

    @Put('programs/:id')
    @ApiOperation({ summary: 'Update a mentorship program (Admin)' })
    async updateProgram(@Param('id') id: string, @Body() body: any) {
        return this.mentorshipService.updateProgram(+id, body);
    }

    @Get('programs/:id/applications')
    @ApiOperation({ summary: 'Get program applications (Admin)' })
    async getProgramApplications(@Param('id') id: string) {
        return this.mentorshipService.getProgramApplications(+id);
    }

    @Put('applications/:id/status')
    @ApiOperation({ summary: 'Update application status (Admin)' })
    async updateApplicationStatus(
        @Param('id') id: string,
        @Body() body: { status: 'accepted' | 'rejected' },
    ) {
        return this.mentorshipService.updateApplicationStatus(+id, body.status);
    }
}
