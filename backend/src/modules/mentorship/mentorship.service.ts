import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MentorshipProgram } from './entities/mentorship-program.entity';
import { MentorshipApplication } from './entities/mentorship-application.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MentorshipService {
    constructor(
        @InjectRepository(MentorshipProgram)
        private programRepository: Repository<MentorshipProgram>,
        @InjectRepository(MentorshipApplication)
        private applicationRepository: Repository<MentorshipApplication>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private notificationsService: NotificationsService,
    ) { }

    // ─── Programs ─────────────────────────────────────────

    async getPrograms() {
        const programs = await this.programRepository.find({
            order: { createdAt: 'DESC' },
            relations: ['applications'],
            take: 50,
        });

        // Auto-update status based on dates
        const now = new Date();
        for (const program of programs) {
            let newStatus = program.status;
            if (now < new Date(program.applicationStartDate)) {
                newStatus = 'upcoming';
            } else if (now >= new Date(program.applicationStartDate) && now <= new Date(program.applicationEndDate)) {
                newStatus = 'accepting';
            } else if (now > new Date(program.applicationEndDate) && now < new Date(program.programStartDate)) {
                newStatus = 'in_review';
            } else if (now >= new Date(program.programStartDate) && (!program.programEndDate || now <= new Date(program.programEndDate))) {
                newStatus = 'active';
            } else if (program.programEndDate && now > new Date(program.programEndDate)) {
                newStatus = 'completed';
            }

            if (newStatus !== program.status) {
                program.status = newStatus;
                await this.programRepository.update(program.id, { status: newStatus });
            }
        }

        return programs.map(p => ({
            ...p,
            applicationCount: p.applications?.length || 0,
            applications: undefined, // Don't send all applications to users
        }));
    }

    async getProgramById(id: number) {
        const program = await this.programRepository.findOne({
            where: { id },
        });
        if (!program) throw new NotFoundException('Program not found');
        return program;
    }

    async createProgram(data: Partial<MentorshipProgram>) {
        const program = this.programRepository.create(data);
        return this.programRepository.save(program);
    }

    async deleteProgram(id: number) {
        await this.applicationRepository.delete({ programId: id });
        await this.programRepository.delete(id);
        return { message: 'Program deleted' };
    }

    async updateProgram(id: number, data: Partial<MentorshipProgram>) {
        const program = await this.getProgramById(id);
        Object.assign(program, data);
        return this.programRepository.save(program);
    }

    // ─── Applications ─────────────────────────────────────

    async applyToProgram(userId: number, programId: number, data: { motivation: string; experience?: string; phone?: string; email?: string; fullName?: string; university?: string; department?: string }) {
        const program = await this.getProgramById(programId);

        // Check if application period is open
        const now = new Date();
        if (now < new Date(program.applicationStartDate) || now > new Date(program.applicationEndDate)) {
            throw new BadRequestException('Başvuru dönemi kapalı');
        }

        // Check if already applied
        const existing = await this.applicationRepository.findOne({
            where: { programId, userId },
        });
        if (existing) {
            throw new BadRequestException('Bu programa zaten başvurdunuz');
        }

        const application = this.applicationRepository.create({
            programId,
            userId,
            motivation: data.motivation,
            experience: data.experience,
            phone: data.phone,
            email: data.email,
            fullName: data.fullName,
            university: data.university,
            department: data.department,
            status: 'pending',
        });

        const savedApplication = await this.applicationRepository.save(application);

        // Notify specific admin
        const adminUser = await this.userRepository.findOne({ where: { email: 'ibrahimsafa1903@gmail.com' } });
        if (adminUser) {
            await this.notificationsService.createNotification(
                adminUser.id,
                'Yeni Mentorluk Başvurusu',
                `"${program.title}" programı için yeni bir başvuru alındı (${data.fullName || 'Bir kullanıcı'}).`,
                'SYSTEM'
            );
        }

        return savedApplication;
    }

    async getMyApplications(userId: number) {
        return this.applicationRepository.find({
            where: { userId },
            relations: ['program'],
            order: { createdAt: 'DESC' },
        });
    }

    async getProgramApplications(programId: number) {
        return this.applicationRepository.find({
            where: { programId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    async updateApplicationStatus(applicationId: number, status: 'accepted' | 'rejected') {
        const application = await this.applicationRepository.findOne({
            where: { id: applicationId },
            relations: ['program'],
        });
        if (!application) throw new NotFoundException('Application not found');

        application.status = status;
        await this.applicationRepository.save(application);

        // Send notification
        const type = status === 'accepted' ? 'mentorship_accepted' : 'mentorship_rejected';
        const message = status === 'accepted'
            ? `"${application.program.title}" mentorluk programına başvurunuz kabul edildi! 🎉`
            : `"${application.program.title}" mentorluk programına başvurunuz reddedildi.`;

        await this.notificationsService.createNotification(
            application.userId,
            'Mentorluk Programı',
            message,
            type,
        );

        return application;
    }
}
