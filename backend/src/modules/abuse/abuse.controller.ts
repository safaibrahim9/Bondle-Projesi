import { Controller, Post, Get, Delete, Body, UseGuards, Ip, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AbuseService } from './abuse.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportReason } from './entities/report.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Abuse Management')
@Controller('abuse')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AbuseController {
    constructor(private readonly abuseService: AbuseService) {}

    @Post('report')
    @ApiOperation({ summary: 'Report a user for abuse/spam' })
    async reportUser(
        @CurrentUser() user: any,
        @Ip() ip: string,
        @Body() dto: { reportedUserId: number; reason: ReportReason; details?: string }
    ) {
        return this.abuseService.reportUser(user.sub, dto.reportedUserId, dto.reason, dto.details, ip);
    }

    @Post('block/:id')
    @ApiOperation({ summary: 'Block a user' })
    async blockUser(
        @CurrentUser() user: any,
        @Ip() ip: string,
        @Param('id') id: string
    ) {
        return this.abuseService.blockUser(user.sub, +id, ip);
    }

    @Delete('block/:id')
    @ApiOperation({ summary: 'Unblock a user' })
    async unblockUser(
        @CurrentUser() user: any,
        @Param('id') id: string
    ) {
        return this.abuseService.unblockUser(user.sub, +id);
    }

    @Get('blocks')
    @ApiOperation({ summary: 'Get my blocked users' })
    async getBlocks(@CurrentUser() user: any) {
        return this.abuseService.getMyBlockedUsers(user.sub);
    }

    // Admin Endpoints
    @Get('admin/reports')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all pending reports (Admin Only)' })
    async getReports() {
        return this.abuseService.getPendingReports();
    }

    @Post('admin/reports/:id/resolve')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Resolve a report (Admin Only)' })
    async resolveReport(
        @Param('id') id: string,
        @Body() dto: { adminNote: string }
    ) {
        return this.abuseService.resolveReport(+id, dto.adminNote);
    }
}
