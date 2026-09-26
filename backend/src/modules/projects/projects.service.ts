import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectApplication } from './entities/project-application.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
        @InjectRepository(ProjectApplication)
        private applicationRepository: Repository<ProjectApplication>,
        private notificationsService: NotificationsService,
    ) {}

    async getAll(category?: string, skill?: string) {
        const query = this.projectRepository.createQueryBuilder('project')
            .leftJoinAndSelect('project.creator', 'creator')
            .loadRelationCountAndMap('project.applicationCount', 'project.applications')
            .where('project.status = :status', { status: 'open' })
            .orderBy('project.createdAt', 'DESC');

        if (category) {
            query.andWhere('project.category = :category', { category });
        }

        if (skill) {
            query.andWhere('project.requiredSkills LIKE :skill', { skill: `%${skill}%` });
        }

        const projects = await query.getMany();

        return projects.map(p => ({
            ...p,
            creator: p.creator ? {
                id: p.creator.id,
                name: p.creator.name,
                surname: p.creator.surname,
                profilePicture: p.creator.profilePicture,
                title: p.creator.title,
                githubUrl: (p.creator as any).githubUrl,
                linkedinUrl: (p.creator as any).linkedinUrl,
            } : null,
        }));
    }

    async getOne(id: number, userId?: number) {
        const project = await this.projectRepository.findOne({
            where: { id },
            relations: ['creator', 'applications', 'applications.user'],
        });
        if (!project) throw new NotFoundException('Proje bulunamadı.');

        let myApplication = null;
        if (userId) {
            myApplication = await this.applicationRepository.findOne({
                where: { projectId: id, userId },
            });
        }

        return {
            ...project,
            creator: project.creator ? {
                id: project.creator.id,
                name: project.creator.name,
                surname: project.creator.surname,
                profilePicture: project.creator.profilePicture,
                title: project.creator.title,
                githubUrl: (project.creator as any).githubUrl,
                linkedinUrl: (project.creator as any).linkedinUrl,
            } : null,
            myApplication,
            isOwner: userId ? project.creatorId === userId : false,
        };
    }

    async create(data: any, userId: number) {
        const project = this.projectRepository.create({
            ...data,
            creatorId: userId,
            status: 'open',
            currentMembers: 1,
        });
        return this.projectRepository.save(project);
    }

    async update(id: number, data: any, userId: number) {
        const project = await this.projectRepository.findOne({ where: { id } });
        if (!project) throw new NotFoundException('Proje bulunamadı.');
        if (project.creatorId !== userId) throw new ForbiddenException('Bu projeyi düzenleme yetkiniz yok.');
        Object.assign(project, data);
        return this.projectRepository.save(project);
    }

    async delete(id: number, userId: number) {
        const project = await this.projectRepository.findOne({ where: { id } });
        if (!project) throw new NotFoundException('Proje bulunamadı.');
        if (project.creatorId !== userId) throw new ForbiddenException('Bu projeyi silme yetkiniz yok.');
        return this.projectRepository.remove(project);
    }

    async apply(projectId: number, userId: number, payload: any) {
        const project = await this.projectRepository.findOne({ where: { id: projectId } });
        if (!project) throw new NotFoundException('Proje bulunamadı.');
        if (project.status !== 'open') throw new BadRequestException('Bu proje artık başvuruya kapalı.');
        if (project.creatorId === userId) throw new BadRequestException('Kendi projenize başvuramazsınız.');
        if (project.currentMembers >= project.maxMembers) throw new BadRequestException('Proje ekibi doldu.');

        const existing = await this.applicationRepository.findOne({ where: { projectId, userId } });
        if (existing) throw new BadRequestException('Bu projeye zaten başvurdunuz.');

        const application = this.applicationRepository.create({ 
            projectId, 
            userId, 
            motivation: payload.motivation,
            nameSurname: payload.nameSurname,
            linkedinUrl: payload.linkedinUrl,
            githubUrl: payload.githubUrl,
            portfolioUrl: payload.portfolioUrl,
            status: 'pending' 
        });
        const saved = await this.applicationRepository.save(application);

        // Notify project creator
        await this.notificationsService.createNotification(
            project.creatorId,
            'Yeni Proje Başvurusu 🚀',
            `"${project.title}" projenize yeni bir başvuru geldi.`,
            'PROJECT_APPLICATION',
            project.id,
        );

        return saved;
    }

    async respondToApplication(applicationId: number, userId: number, accept: boolean) {
        const application = await this.applicationRepository.findOne({
            where: { id: applicationId },
            relations: ['project'],
        });
        if (!application) throw new NotFoundException('Başvuru bulunamadı.');
        if (application.project.creatorId !== userId) throw new ForbiddenException('Bu başvuruyu yönetme yetkiniz yok.');

        application.status = accept ? 'accepted' : 'rejected';
        await this.applicationRepository.save(application);

        if (accept) {
            application.project.currentMembers += 1;
            if (application.project.currentMembers >= application.project.maxMembers) {
                application.project.status = 'closed';
            }
            await this.projectRepository.save(application.project);
        }

        // Notify applicant
        await this.notificationsService.createNotification(
            application.userId,
            accept ? 'Proje Başvurunuz Kabul Edildi! 🎉' : 'Proje Başvurusu Hakkında',
            accept
                ? `"${application.project.title}" projesine katılım başvurunuz kabul edildi.`
                : `"${application.project.title}" projesine başvurunuz bu sefer olumsuz sonuçlandı.`,
            accept ? 'PROJECT_ACCEPTED' : 'PROJECT_REJECTED',
            application.project.id,
        );

        return application;
    }

    async getMyProjects(userId: number) {
        return this.projectRepository.find({
            where: { creatorId: userId },
            relations: ['applications', 'applications.user'],
            order: { createdAt: 'DESC' },
        });
    }

    async getMyApplications(userId: number) {
        return this.applicationRepository.find({
            where: { userId },
            relations: ['project', 'project.creator'],
            order: { createdAt: 'DESC' },
        });
    }
}
