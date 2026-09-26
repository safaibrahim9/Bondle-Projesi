import { Controller, Get, Post, Body, UseGuards, Req, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @UseGuards(JwtAuthGuard)
    @Post('log')
    async logActivity(@Req() req, @Body() body: { page: string, duration: number }) {
        return this.analyticsService.logActivity(req.user.sub, body.page, body.duration);
    }

    @UseGuards(JwtAuthGuard)
    @Post('event')
    async logEvent(@Req() req, @Body() body: { type: string, name: string, metadata?: any }) {
        return this.analyticsService.logEvent(req.user.sub, body.type, body.name, body.metadata);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('admin/summary')
    async getAdminSummary(@Query('period') period?: string) {
        return this.analyticsService.getOverallStats(period);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('admin/insights')
    async getAIInsights(@Query('period') period?: string) {
        return this.analyticsService.getAIInsights(period || 'all');
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('admin/user/:id')
    async getUserSummaryForAdmin(@Param('id') id: string, @Query('period') period?: string) {
        return this.analyticsService.getUserActivitySummary(parseInt(id), period);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('admin/page-users')
    async getPageUsers(@Query('page') page: string, @Query('period') period?: string) {
        return this.analyticsService.getPageUsers(page, period);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('admin/daily-users')
    async getDailyUsers(@Query('date') date: string) {
        return this.analyticsService.getDailyUsers(date);
    }

    @UseGuards(JwtAuthGuard)
    @Get('my-summary')
    async getMySummary(@Req() req, @Query('period') period?: string) {
        return this.analyticsService.getUserActivitySummary(req.user.sub, period);
    }
}
