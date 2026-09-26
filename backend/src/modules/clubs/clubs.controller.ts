import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFile,
    ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClubsService } from './clubs.service';
import { CreateClubDto, UpdateClubDto } from './dto/clubs.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { EngagementService } from '../engagement/engagement.service';

@ApiTags('clubs')
@Controller('clubs')
export class ClubsController {
    constructor(
        private readonly clubsService: ClubsService,
        private readonly engagementService: EngagementService
    ) { }

    @Get()
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: 'Get all clubs' })
    async getAllClubs(@Query('city') city?: string, @Request() req?: any) {
        if (req?.user?.sub) {
            await this.engagementService.completeDailyGoal(req.user.sub, 'view_clubs');
        }
        return this.clubsService.getAllClubs(city);
    }

    @Get('pending')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get pending clubs (admin only)' })
    async getPendingClubs(@Request() req) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can view pending clubs');
        }
        return this.clubsService.getPendingClubs();
    }

    @Get('managed')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get clubs managed by current user' })
    async getManagedClubs(@Request() req) {
        return this.clubsService.getManagedClubs(req.user.sub);
    }

    @Get('leaderboard')
    @ApiOperation({ summary: 'Get clubs leaderboard' })
    async getClubLeaderboard() {
        return this.clubsService.getClubLeaderboard();
    }

    @Get(':id')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: 'Get club by ID' })
    async getClubById(@Param('id') id: string, @Request() req) {
        const userId = req.user?.sub || undefined;
        if (userId) {
            await this.engagementService.completeDailyGoal(userId, 'view_clubs');
        }
        return this.clubsService.getClubById(+id, userId);
    }

    @Get(':id/analytics')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: 'Get club analytics' })
    async getClubAnalytics(@Param('id') id: string, @Request() req) {
        return this.clubsService.getClubAnalytics(+id, req.user?.sub, req.user?.role);
    }



    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Create new club request (any user)' })
    async createClub(@Request() req, @Body() createClubDto: CreateClubDto) {
        // Any authenticated user can submit a club creation request.
        // If not admin, the club will be created in pending state (isApproved: 0).
        return this.clubsService.createClub(req.user.sub, req.user.role, createClubDto);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update club (president only)' })
    async updateClub(
        @Param('id') id: string,
        @Request() req,
        @Body() updateClubDto: UpdateClubDto,
    ) {
        return this.clubsService.updateClub(+id, req.user.sub, req.user.role, updateClubDto);
    }

    @Post(':id/upload-logo')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload club logo (president only)' })
    async uploadLogo(
        @Param('id') id: string,
        @Request() req,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.clubsService.uploadLogo(+id, req.user.sub, req.user.role, file);
    }

    @Post(':id/join')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Join club' })
    async joinClub(@Param('id') id: string, @Request() req, @Query('source') source?: string) {
        return this.clubsService.joinClub(+id, req.user.sub, source);
    }

    @Delete(':id/leave')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Leave club' })
    async leaveClub(@Param('id') id: string, @Request() req) {
        return this.clubsService.leaveClub(+id, req.user.sub);
    }

    // NOTE: 'pending' route moved above ':id' to fix NestJS route matching order

    @Put(':id/approve')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Approve club (admin only)' })
    async approveClub(@Param('id') id: string, @Request() req) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can approve clubs');
        }
        return this.clubsService.approveClub(+id, req.user.sub);
    }

    @Put(':id/reject')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Reject club (admin only)' })
    async rejectClub(
        @Param('id') id: string,
        @Request() req,
        @Body() body: { reason: string },
    ) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can reject clubs');
        }
        return this.clubsService.rejectClub(+id, req.user.sub, body.reason);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Delete club (admin only)' })
    async deleteClub(@Param('id') id: string, @Request() req) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can delete clubs');
        }
        return this.clubsService.deleteClub(+id);
    }

    @Get(':id/officials')
    @ApiOperation({ summary: 'Get club officials' })
    async getClubOfficials(@Param('id') id: string) {
        return this.clubsService.getClubOfficials(+id);
    }

    @Get(':id/members')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: 'Get club members with scores' })
    async getClubMembers(@Param('id') id: string, @Request() req) {
        if (req.user?.sub) {
            return this.clubsService.getClubMembersWithScores(+id, req.user.sub);
        }
        return this.clubsService.getClubMembers(+id);
    }

    @Put(':id/officials')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update club officials (admin only)' })
    async updateClubOfficials(
        @Param('id') id: string,
        @Request() req,
        @Body() body: { officialUserIds: number[] },
    ) {
        const isOfficial = await this.clubsService.isClubOfficial(+id, req.user.sub);
        if (req.user.role !== 'admin' && req.user.role !== 'ADMIN' && !isOfficial) {
            throw new ForbiddenException('Only admins and club officials can update officials');
        }
        return this.clubsService.updateClubOfficials(+id, body.officialUserIds);
    }

    @Post(':id/gallery')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Add image to club gallery' })
    async addGalleryImage(
        @Param('id') id: string,
        @Request() req,
        @UploadedFile() file: Express.Multer.File,
        @Body('caption') caption?: string,
        @Body('eventName') eventName?: string,
    ) {
        return this.clubsService.addGalleryImage(+id, req.user.sub, req.user.role, file, caption, eventName);
    }

    @Delete('gallery/:imageId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Remove image from club gallery' })
    async removeGalleryImage(@Param('imageId') imageId: string, @Request() req) {
        return this.clubsService.removeGalleryImage(+imageId, req.user.sub, req.user.role);
    }

    @Put('gallery/:imageId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update gallery image metadata' })
    async updateGalleryImage(
        @Param('imageId') imageId: string,
        @Request() req,
        @Body() data: { caption?: string, eventName?: string }
    ) {
        return this.clubsService.updateGalleryImage(+imageId, req.user.sub, req.user.role, data);
    }

    @Put(':id/gallery/order')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update gallery images order' })
    async updateGalleryOrder(
        @Param('id') id: string,
        @Request() req,
        @Body() orderData: { imageId: number, displayOrder: number }[]
    ) {
        return this.clubsService.updateGalleryOrder(+id, req.user.sub, req.user.role, orderData);
    }
}
