import { Controller, Get, Post, Put, Body, Param, Delete, ParseIntPipe, UseGuards, UseInterceptors, UploadedFile, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@Controller('announcements')
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) { }

    // Public endpoint
    @Get()
    findAll() {
        return this.announcementsService.findAll();
    }

    @Get('clubs-recent')
    findAllClubAnnouncements() {
        return this.announcementsService.findAllClubAnnouncements();
    }

    @Get('club/:clubId')
    findByClubId(@Param('clubId', ParseIntPipe) clubId: number) {
        return this.announcementsService.findByClubId(clubId);
    }

    // Admin only
    @Get('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    findAllForAdmin() {
        return this.announcementsService.findAllForAdmin();
    }

    @Post()
    @UseGuards(JwtAuthGuard) // Removed Roles(UserRole.ADMIN)
    create(@Body() createAnnouncementDto: CreateAnnouncementDto, @Request() req) {
        return this.announcementsService.create(createAnnouncementDto, req.user.sub);
    }

    @Put('reorder')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    reorder(@Body() items: { id: number, priority: number }[]) {
        return this.announcementsService.reorder(items);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    update(
        @Param('id', ParseIntPipe) id: number, 
        @Body() updateDto: any,
        @Request() req
    ) {
        return this.announcementsService.update(id, updateDto, req.user.sub, req.user.role);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.announcementsService.remove(id, req.user.sub, req.user.role);
    }

    @Post('upload')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    uploadImage(@UploadedFile() file: any) {
        return this.announcementsService.uploadImage(file);
    }

    @Put(':id/toggle-global')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    toggleGlobal(@Param('id', ParseIntPipe) id: number) {
        return this.announcementsService.toggleGlobal(id);
    }
}
