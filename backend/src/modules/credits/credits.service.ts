import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Credit } from './entities/credit.entity';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { User } from '../users/entities/user.entity';
import { TransactionType, UserRole } from '../../common/enums';

@Injectable()
export class CreditsService {
    constructor(
        @InjectRepository(Credit)
        private creditRepository: Repository<Credit>,
        @InjectRepository(CreditTransaction)
        private transactionRepository: Repository<CreditTransaction>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async getUserCredits(userId: number) {
        let credit = await this.creditRepository.findOne({ where: { userId } });
        if (!credit) {
            // Auto-create credit record for new users
            const user = await this.userRepository.findOne({ where: { id: userId } });
            const creditAmount = user ? this.getCreditsForUser(user) : 5;
            credit = this.creditRepository.create({
                userId,
                totalCredits: creditAmount,
                availableCredits: creditAmount,
                usedCredits: 0,
                lastResetDate: new Date(),
            });
            credit = await this.creditRepository.save(credit);
        }
        return credit;
    }

    async deductCredits(
        userId: number,
        amount: number,
        type: TransactionType,
        referenceId?: number,
        description?: string,
    ) {
        const credit = await this.getUserCredits(userId);

        if (credit.availableCredits < amount) {
            throw new BadRequestException('Insufficient credits');
        }

        credit.usedCredits += amount;
        credit.availableCredits -= amount;
        await this.creditRepository.save(credit);

        // Log transaction
        const transaction = this.transactionRepository.create({
            userId,
            creditsUsed: -amount, // Negative for deductions if you prefer, or handle in UI. Wait, let's keep it positive for creditsUsed
            transactionType: type,
            referenceId,
            description,
        });
        await this.transactionRepository.save(transaction);

        return credit;
    }

    async addCredits(
        userId: number,
        amount: number,
        type: TransactionType,
        description?: string,
    ) {
        const credit = await this.getUserCredits(userId);

        credit.totalCredits += amount;
        credit.availableCredits += amount;
        await this.creditRepository.save(credit);

        // Log transaction
        const transaction = this.transactionRepository.create({
            userId,
            creditsUsed: amount, // Positive for additions
            transactionType: type,
            description,
        });
        await this.transactionRepository.save(transaction);

        return credit;
    }

    async getCreditHistory(userId: number) {
        return this.transactionRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }

    // Cron job: Reset credits every Monday at 00:00 (Turkey Time)
    @Cron(CronExpression.EVERY_WEEK)
    async resetWeeklyCredits() {
        if (process.env.RUN_CRON !== 'true') return;
        console.log('Starting weekly credit reset...');

        const users = await this.userRepository.find();

        for (const user of users) {
            const creditAmount = this.getCreditsForUser(user);

            await this.creditRepository.update(
                { userId: user.id },
                {
                    totalCredits: creditAmount,
                    availableCredits: creditAmount,
                    usedCredits: 0,
                    lastResetDate: new Date(),
                },
            );

            // Log reset transaction
            const transaction = this.transactionRepository.create({
                userId: user.id,
                creditsUsed: 0,
                transactionType: TransactionType.WEEKLY_RESET,
                description: 'Weekly credit reset',
            });
            await this.transactionRepository.save(transaction);
        }

        console.log(`Weekly credit reset complete: ${users.length} users`);
    }

    private getCreditsForUser(user: User): number {
        // Premium users get 30 credits regardless of role
        if (user.isPremium) {
            return 30;
        }

        // Regular users get credits based on role
        switch (user.role) {
            case UserRole.ADMIN:
                return 9999;
            case UserRole.CLUB_PRESIDENT:
                return 10;
            case UserRole.USER:
            default:
                return 5;
        }
    }
}
