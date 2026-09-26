import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competition } from './entities/competition.entity';
import { CompetitionSubmission } from './entities/competition-submission.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CompetitionsService {
    constructor(
        @InjectRepository(Competition)
        private competitionRepository: Repository<Competition>,
        @InjectRepository(CompetitionSubmission)
        private submissionRepository: Repository<CompetitionSubmission>,
        private notificationsService: NotificationsService,
    ) { }

    async getAllCompetitions() {
        return this.competitionRepository.find({
            where: { status: 'active' },
            order: { deadline: 'ASC' },
            take: 100,
        });
    }

    async getCompetitionById(id: number) {
        return this.competitionRepository.findOne({ where: { id } });
    }

    async createCompetition(data: Partial<Competition>) {
        const competition = this.competitionRepository.create(data);
        return this.competitionRepository.save(competition);
    }

    async updateCompetition(id: number, data: Partial<Competition>) {
        await this.competitionRepository.update(id, data);
        return this.competitionRepository.findOne({ where: { id } });
    }

    async deleteCompetition(id: number) {
        // Delete related submissions first
        await this.submissionRepository.delete({ competitionId: id });
        await this.competitionRepository.delete(id);
        return { success: true, message: 'Competition deleted' };
    }

    async register(competitionId: number) {
        const competition = await this.getCompetitionById(competitionId);
        if (competition) {
            competition.participantCount += 1;
            return this.competitionRepository.save(competition);
        }
        throw new Error('Competition not found');
    }

    async createSubmission(userId: number, competitionId: number, dto: CreateSubmissionDto) {
        const competition = await this.getCompetitionById(competitionId);
        if (!competition) {
            throw new Error('Competition not found');
        }

        // Check if already submitted
        const existing = await this.submissionRepository.findOne({
            where: { userId, competitionId },
        });

        if (existing) {
            throw new Error('Already submitted to this competition');
        }

        const submission = this.submissionRepository.create({
            userId,
            competitionId,
            name: dto.name,
            surname: dto.surname,
            email: dto.email,
            phone: dto.phone,
            motivation: dto.motivation,
            university: dto.university,
            department: dto.department,
            notes: dto.notes,
            status: 'pending',
        });

        // Increment participant count
        competition.participantCount += 1;
        await this.competitionRepository.save(competition);

        return this.submissionRepository.save(submission);
    }

    async getAllSubmissions() {
        return this.submissionRepository.find({
            relations: ['user', 'competition'],
            order: { createdAt: 'DESC' },
        });
    }

    async getUserSubmissions(userId: number) {
        return this.submissionRepository.find({
            where: { userId },
            relations: ['competition'],
            order: { createdAt: 'DESC' },
        });
    }

    async getCompetitionSubmissions(competitionId: number) {
        return this.submissionRepository.find({
            where: { competitionId },
            relations: ['user', 'competition'],
            order: { createdAt: 'DESC' },
        });
    }

    async updateSubmissionStatus(id: number, status: string) {
        await this.submissionRepository.update(id, { status });
        const submission = await this.submissionRepository.findOne({
            where: { id },
            relations: ['competition'],
        });

        // Send notification to the user
        if (submission) {
            const competitionTitle = submission.competition?.title || 'Yarışma';

            if (status === 'approved') {
                await this.notificationsService.createNotification(
                    submission.userId,
                    'Başvurunuz Onaylandı! 🎉',
                    `"${competitionTitle}" yarışmasına yaptığınız başvuru onaylandı. Tebrikler!`,
                    'competition_approved',
                );
            } else if (status === 'rejected') {
                await this.notificationsService.createNotification(
                    submission.userId,
                    'Başvurunuz Reddedildi',
                    `"${competitionTitle}" yarışmasına yaptığınız başvuru maalesef reddedildi.`,
                    'competition_rejected',
                );
            }
        }

        return submission;
    }

    async deleteSubmission(id: number) {
        const submission = await this.submissionRepository.findOne({
            where: { id },
            relations: ['competition'],
        });

        if (!submission) {
            throw new Error('Submission not found');
        }

        // Decrement participant count
        if (submission.competition) {
            submission.competition.participantCount = Math.max(0, submission.competition.participantCount - 1);
            await this.competitionRepository.save(submission.competition);
        }

        await this.submissionRepository.delete(id);
        return { success: true, message: 'Submission deleted' };
    }
}
