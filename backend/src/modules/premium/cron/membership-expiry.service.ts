import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PremiumMembership } from '../entities/premium-membership.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class MembershipExpiryService {
    private readonly logger = new Logger(MembershipExpiryService.name);

    constructor(
        @InjectRepository(PremiumMembership)
        private membershipRepository: Repository<PremiumMembership>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    // Run every day at midnight
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleExpiredMemberships() {
        if (process.env.RUN_CRON !== 'true') return;
        this.logger.log('Checking for expired premium memberships...');

        const now = new Date();

        // Find memberships that expired before right now and are still marked 'active'
        const expiredMemberships = await this.membershipRepository.find({
            where: {
                endDate: LessThan(now),
                status: 'active',
            },
        });

        if (expiredMemberships.length === 0) {
            this.logger.log('No expired memberships found.');
            return;
        }

        this.logger.log(`Found ${expiredMemberships.length} expired memberships. Processing...`);

        for (const membership of expiredMemberships) {
            // Mark membership as expired
            membership.status = 'expired';
            await this.membershipRepository.save(membership);

            // Update user status
            const user = await this.userRepository.findOne({ where: { id: membership.userId } });
            if (user) {
                // Double check they don't have another active membership (e.g., they bought a new one before the old one expired)
                const otherActive = await this.membershipRepository.findOne({
                    where: { userId: user.id, status: 'active' },
                });

                if (!otherActive) {
                    user.isPremium = false;
                    user.premiumStatus = 'expired';
                    await this.userRepository.save(user);
                    this.logger.log(`User ${user.id} premium status revoked (expired).`);
                }
            }
        }

        this.logger.log('Expired memberships processing completed.');
    }
}
