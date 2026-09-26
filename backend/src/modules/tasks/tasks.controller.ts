import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    // Kullanıcının kendi görevlerini çekmesi
    @Get('my-tasks')
    async getMyTasks(@Request() req) {
        return this.tasksService.findMyTasks(req.user.sub);
    }

    // Kullanıcının görevi güncellemesi (tamamla, not yaz vs.)
    @Patch(':id/complete')
    async completeTask(@Param('id') id: string, @Body() updateData: any, @Request() req) {
        return this.tasksService.updateTask(+id, req.user.sub, updateData);
    }

    // --- ADMIN ENDPOINTS ---

    @Post('admin')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.USER, UserRole.CAMPUS_AMBASSADOR)
    async createTask(@Body() createTaskDto: any, @Request() req) {
        return this.tasksService.create(createTaskDto, req.user.sub);
    }

    @Get('admin')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.USER, UserRole.CAMPUS_AMBASSADOR)
    async getAllTasks(@Request() req) {
        return this.tasksService.findAllByAdmin(req.user.sub);
    }

    @Patch('admin/:id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.USER, UserRole.CAMPUS_AMBASSADOR)
    async adminUpdateTask(@Param('id') id: string, @Body() updateData: any, @Request() req) {
        return this.tasksService.adminUpdateTask(+id, req.user.sub, updateData);
    }

    @Delete('admin/:id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.USER, UserRole.CAMPUS_AMBASSADOR)
    async deleteTask(@Param('id') id: string, @Request() req) {
        await this.tasksService.deleteTask(+id, req.user.sub);
        return { success: true };
    }
}
