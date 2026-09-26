import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile, Query, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }
    
    @Get('search')
    @ApiOperation({ summary: 'Search users by name/surname' })
    async searchUsers(@Query('q') query: string) {
        return this.usersService.searchUsers(query);
    }

    @Get('branch-representatives')
    @ApiOperation({ summary: 'Get list of branch representatives' })
    async getBranchRepresentatives() {
        return this.usersService.getBranchRepresentatives();
    }

    @Get('profile/:id')
    @ApiOperation({ summary: 'Get user profile by ID' })
    async getProfile(@Param('id') id: string, @CurrentUser() user?: any) {
        return this.usersService.findOne(+id, user?.sub);
    }

    @Get('me/profile-views')
    @ApiOperation({ summary: 'Get recent profile views for current user' })
    async getMyProfileViews(@CurrentUser() user: any) {
        return this.usersService.getRecentProfileViews(user.sub);
    }

    @Get('me/referrals')
    @ApiOperation({ summary: 'Get users referred by the current user' })
    async getMyReferrals(@CurrentUser() user: any) {
        return this.usersService.getReferrals(user.sub);
    }

    @Put('profile')
    @ApiOperation({ summary: 'Update current user profile' })
    async updateProfile(@CurrentUser() user: any, @Body() updates: UpdateProfileDto) {
        return this.usersService.updateProfile(user.sub, updates);
    }

    @Get('available')
    @ApiOperation({ summary: 'Get available users for networking' })
    async getAvailableUsers(@CurrentUser() user: any) {
        return this.usersService.getAvailableForNetworking(user.sub);
    }

    @Get('me/events')
    @ApiOperation({ summary: 'Get current user registered events' })
    async getMyEvents(@CurrentUser() user: any) {
        return this.usersService.getUserEvents(user.sub);
    }

    @Post('upload-avatar')
    @ApiOperation({ summary: 'Upload profile picture' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    async uploadAvatar(
        @CurrentUser() user: any,
        @UploadedFile() file: any,
    ) {
        return this.usersService.uploadAvatar(user.sub, file);
    }

    @Delete('me')
    @ApiOperation({ summary: 'Delete current user account permanently' })
    async deleteAccount(@CurrentUser() user: any, @Ip() ip: string) {
        return this.usersService.deleteAccount(user.sub, ip);
    }

    @Get('me/export')
    @ApiOperation({ summary: 'Export all user data as JSON' })
    async exportData(@CurrentUser() user: any) {
        return this.usersService.exportUserData(user.sub);
    }
}
