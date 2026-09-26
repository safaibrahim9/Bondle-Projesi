import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompetitionsService } from './competitions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../common/enums';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@ApiTags('Competitions')
@Controller('competitions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CompetitionsController {
    constructor(private readonly competitionsService: CompetitionsService) { }

    @Public()
    @Get()
    @ApiOperation({ summary: 'Get all active competitions' })
    async getAll() {
        return this.competitionsService.getAllCompetitions();
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get competition by ID' })
    async getById(@Param('id') id: string) {
        return this.competitionsService.getCompetitionById(+id);
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create competition (Admin only)' })
    async create(@Body() data: any) {
        return this.competitionsService.createCompetition(data);
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update competition (Admin only)' })
    async update(@Param('id') id: string, @Body() data: any) {
        return this.competitionsService.updateCompetition(+id, data);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete competition (Admin only)' })
    async deleteCompetition(@Param('id') id: string) {
        return this.competitionsService.deleteCompetition(+id);
    }

    @Post(':id/submit')
    @ApiOperation({ summary: 'Submit competition entry' })
    async submit(
        @Param('id') id: string,
        @Request() req,
        @Body() dto: CreateSubmissionDto
    ) {
        return this.competitionsService.createSubmission(req.user.sub, +id, dto);
    }

    @Get('my-submissions/all')
    @ApiOperation({ summary: 'Get current user submissions' })
    async getMySubmissions(@Request() req) {
        return this.competitionsService.getUserSubmissions(req.user.sub);
    }

    @Get(':id/applications')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get applications for a competition (Admin only)' })
    async getCompetitionApplications(@Param('id') id: string) {
        return this.competitionsService.getCompetitionSubmissions(+id);
    }

    @Get('submissions/all')
    @ApiOperation({ summary: 'Get all submissions (Admin only)' })
    async getAllSubmissions(@Request() req) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can view submissions');
        }
        return this.competitionsService.getAllSubmissions();
    }

    @Post('submissions/:id/status')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update submission status (Admin only)' })
    async updateSubmissionStatus(
        @Param('id') id: string,
        @Body() body: { status: string }
    ) {
        return this.competitionsService.updateSubmissionStatus(+id, body.status);
    }

    @Delete('submissions/:id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete submission (Admin only)' })
    async deleteSubmission(@Param('id') id: string) {
        return this.competitionsService.deleteSubmission(+id);
    }
}
