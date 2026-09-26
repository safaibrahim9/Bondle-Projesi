import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) {}

    @Get()
    @ApiOperation({ summary: 'Get all open projects' })
    async getAll(
        @Query('category') category?: string,
        @Query('skill') skill?: string,
    ) {
        return this.projectsService.getAll(category, skill);
    }

    @Get('my')
    @ApiOperation({ summary: 'Get my created projects' })
    async getMyProjects(@CurrentUser() user: any) {
        return this.projectsService.getMyProjects(user.sub);
    }

    @Get('my-applications')
    @ApiOperation({ summary: 'Get my project applications' })
    async getMyApplications(@CurrentUser() user: any) {
        return this.projectsService.getMyApplications(user.sub);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get project by ID' })
    async getOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.projectsService.getOne(+id, user.sub);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new project' })
    async create(@Body() body: any, @CurrentUser() user: any) {
        return this.projectsService.create(body, user.sub);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update my project' })
    async update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
        return this.projectsService.update(+id, body, user.sub);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete my project' })
    async delete(@Param('id') id: string, @CurrentUser() user: any) {
        return this.projectsService.delete(+id, user.sub);
    }

    @Post(':id/apply')
    @ApiOperation({ summary: 'Apply to join a project' })
    async apply(
        @Param('id') id: string,
        @Body() body: any,
        @CurrentUser() user: any,
    ) {
        return this.projectsService.apply(+id, user.sub, body);
    }

    @Post('applications/:applicationId/accept')
    @ApiOperation({ summary: 'Accept a project application' })
    async accept(@Param('applicationId') appId: string, @CurrentUser() user: any) {
        return this.projectsService.respondToApplication(+appId, user.sub, true);
    }

    @Post('applications/:applicationId/reject')
    @ApiOperation({ summary: 'Reject a project application' })
    async reject(@Param('applicationId') appId: string, @CurrentUser() user: any) {
        return this.projectsService.respondToApplication(+appId, user.sub, false);
    }
}
