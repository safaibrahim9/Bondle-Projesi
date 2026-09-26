import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private notificationsService: NotificationsService
    ) {}

    private async getAdminUser(adminUserId: number): Promise<User | null> {
        return this.userRepository.findOne({ where: { id: adminUserId } });
    }

    /** Returns true if the caller has admin-level task management rights */
    private canManageAllTasks(user: User): boolean {
        return user.role === 'admin';
    }

    /** Returns true if the caller is a branch rep or authorized user who can manage their own assigned tasks */
    private canManageOwnTasks(user: User): boolean {
        return !!(user.isBranchRepresentative || user.canCreateEvents);
    }

    async create(createTaskDto: any, adminUserId: number): Promise<Task> {
        const taskData: any = {
            ...createTaskDto,
            assignedBy: { id: adminUserId },
            assignedTo: { id: createTaskDto.assignedToId }
        };
        const task = this.taskRepository.create(taskData);
        return this.taskRepository.save(task as any);
    }

    async findAllByAdmin(adminUserId: number): Promise<Task[]> {
        const user = await this.getAdminUser(adminUserId);
        
        if (!user) return [];

        const qb = this.taskRepository.createQueryBuilder('task')
            .leftJoinAndSelect('task.assignedTo', 'assignedTo')
            .leftJoinAndSelect('task.assignedBy', 'assignedBy')
            .orderBy('task.createdAt', 'DESC');

        if (!this.canManageAllTasks(user) && (this.canManageOwnTasks(user))) {
            // Branch reps / authorized users: see tasks THEY assigned OR tasks assigned to their branch
            qb.where('assignedBy.id = :adminUserId', { adminUserId })
              .orWhere('assignedTo.branch = :branch', { branch: user.branch });
        }

        return qb.getMany();
    }

    async findMyTasks(userId: number): Promise<Task[]> {
        return this.taskRepository.find({
            where: { assignedTo: { id: userId } },
            relations: ['assignedBy'],
            order: { createdAt: 'DESC' }
        });
    }

    async updateTask(id: number, userId: number, updateData: any): Promise<Task> {
        const task = await this.taskRepository.findOne({
            where: { id, assignedTo: { id: userId } },
            relations: ['assignedBy', 'assignedTo']
        });

        if (!task) {
            throw new NotFoundException('Görev bulunamadı veya size atanmamış.');
        }

        const wasCompleted = task.isCompleted;

        task.isCompleted = updateData.isCompleted !== undefined ? updateData.isCompleted : task.isCompleted;
        task.notes = updateData.notes !== undefined ? updateData.notes : task.notes;
        task.tableData = updateData.tableData !== undefined ? updateData.tableData : task.tableData;

        const updatedTask = await this.taskRepository.save(task);

        // If newly completed or notes added, notify admin
        if ((!wasCompleted && updatedTask.isCompleted) || updateData.notes) {
            if (task.assignedBy) {
                await this.notificationsService.createNotification(
                    task.assignedBy.id,
                    'Görev Güncellemesi',
                    `${task.assignedTo.name} ${task.assignedTo.surname} "${task.title}" adlı görevde güncelleme yaptı.`,
                    'task_update',
                    task.id
                );
            }
        }

        return updatedTask;
    }

    async adminUpdateTask(id: number, adminUserId: number, updateData: any): Promise<Task> {
        const user = await this.getAdminUser(adminUserId);

        if (!user) {
            throw new BadRequestException('Yetkisiz işlem');
        }

        // Find the task with explicit joins
        const task = await this.taskRepository.createQueryBuilder('task')
            .leftJoinAndSelect('task.assignedTo', 'assignedTo')
            .leftJoinAndSelect('task.assignedBy', 'assignedBy')
            .where('task.id = :id', { id })
            .getOne();

        if (!task) {
            throw new NotFoundException('Görev bulunamadı.');
        }

        // Permission check
        const isAdmin = this.canManageAllTasks(user);
        const isOwnerOrRep = this.canManageOwnTasks(user) && (
            task.assignedBy?.id === adminUserId ||
            task.assignedTo?.branch === user.branch
        );

        if (!isAdmin && !isOwnerOrRep) {
            throw new NotFoundException('Görev bulunamadı veya düzenleme yetkiniz yok.');
        }

        if (updateData.title !== undefined) task.title = updateData.title;
        if (updateData.description !== undefined) task.description = updateData.description;
        if (updateData.dueDate !== undefined) task.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
        if (updateData.pinnedMessage !== undefined) task.pinnedMessage = updateData.pinnedMessage;
        if (updateData.pinnedLink !== undefined) task.pinnedLink = updateData.pinnedLink;

        return this.taskRepository.save(task);
    }

    async deleteTask(id: number, adminUserId: number): Promise<void> {
        const user = await this.getAdminUser(adminUserId);

        if (!user) {
            throw new BadRequestException('Yetkisiz işlem');
        }

        if (this.canManageAllTasks(user)) {
            // Full admins can delete any task
            const result = await this.taskRepository.delete(id);
            if (result.affected === 0) {
                throw new NotFoundException('Görev bulunamadı.');
            }
            return;
        }

        if (this.canManageOwnTasks(user)) {
            // Branch reps / authorized users: only tasks they assigned or in their branch
            const task = await this.taskRepository.createQueryBuilder('task')
                .leftJoin('task.assignedBy', 'assignedBy')
                .leftJoin('task.assignedTo', 'assignedTo')
                .where('task.id = :id', { id })
                .andWhere('(assignedBy.id = :adminUserId OR assignedTo.branch = :branch)', {
                    adminUserId,
                    branch: user.branch
                })
                .getOne();

            if (!task) {
                throw new NotFoundException('Bu görevi silme yetkiniz yok veya görev bulunamadı.');
            }
            await this.taskRepository.delete(id);
            return;
        }

        throw new BadRequestException('Yetkisiz işlem');
    }
}
