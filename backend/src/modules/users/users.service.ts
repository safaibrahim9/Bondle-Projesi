import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User } from './entities/user.entity';
import { UserInterest } from './entities/user-interest.entity';
import { ProfileView } from './entities/profile-view.entity';
import { CloudinaryService } from '../../common/services/cloudinary.service';
import { EmailService } from '../../common/services/email.service';
import { UserRole } from '../../common/enums';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(UserInterest)
        private userInterestRepository: Repository<UserInterest>,
        @InjectRepository(ProfileView)
        private profileViewRepository: Repository<ProfileView>,
        private cloudinaryService: CloudinaryService,
        private auditLogService: AuditLogService,
        private emailService: EmailService,
    ) { }

    async getReferrals(userId: number) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

        const referrals = await this.userRepository.find({
            where: { referredById: userId }
        });

        return {
            referralCode: user.referralCode,
            totalReferrals: referrals.length,
            referrals: referrals.map(r => ({
                id: r.id,
                name: r.name,
                surname: r.surname,
                profilePicture: r.profilePicture,
                createdAt: r.createdAt
            }))
        };
    }

    async deleteAccount(userId: number, ip: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Log the action first
        await this.auditLogService.logAction(
            userId,
            'USER_DELETE_OWN_ACCOUNT',
            { email: user.email, name: `${user.name} ${user.surname}` },
            ip
        );

        try {
            // Delete associated records manually in CORRECT ORDER (children first)
            await this.userInterestRepository.delete({ userId });
            
            // 1. Delete meeting events (depends on meetings)
            await this.userRepository.query('DELETE FROM meeting_events WHERE "userId" = $1', [userId]);
            await this.userRepository.query(`
                DELETE FROM meeting_events 
                WHERE "meetingId" IN (
                    SELECT m.id FROM meetings m
                    JOIN connections c ON m."connectionId" = c.id
                    WHERE c."user1Id" = $1 OR c."user2Id" = $1
                )
            `, [userId]);

            // 2. Delete meetings (depends on connections)
            await this.userRepository.query(`
                DELETE FROM meetings 
                WHERE "connectionId" IN (
                    SELECT id FROM connections 
                    WHERE "user1Id" = $1 OR "user2Id" = $1
                )
            `, [userId]);

            // 3. Delete connections (depends on matches)
            await this.userRepository.query('DELETE FROM connections WHERE "user1Id" = $1 OR "user2Id" = $1', [userId]);

            // 4. Delete networking matches
            await this.userRepository.query('DELETE FROM networking_matches WHERE "user1Id" = $1 OR "user2Id" = $1', [userId]);
            
            // 4. Delete abuse records
            await this.userRepository.query('DELETE FROM reports WHERE "reporterId" = $1 OR "reportedUserId" = $1', [userId]);
            await this.userRepository.query('DELETE FROM user_blocks WHERE "blockerId" = $1 OR "blockedId" = $1', [userId]);

            // 5. Delete credits
            await this.userRepository.query('DELETE FROM credits WHERE "userId" = $1', [userId]);
            await this.userRepository.query('DELETE FROM credit_transactions WHERE "userId" = $1', [userId]);

            // --- Missing References Deletion ---
            // Engagement
            await this.userRepository.query('DELETE FROM user_streaks WHERE "userId" = $1', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM weekly_challenge_completions WHERE "userId" = $1', [userId]).catch(() => {});
            
            // Community
            await this.userRepository.query('DELETE FROM community_comment_likes WHERE "userId" = $1', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM community_likes WHERE "userId" = $1', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM community_comment_likes WHERE "commentId" IN (SELECT id FROM community_comments WHERE "userId" = $1)', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM community_likes WHERE "postId" IN (SELECT id FROM community_posts WHERE "userId" = $1)', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM community_comments WHERE "postId" IN (SELECT id FROM community_posts WHERE "userId" = $1)', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM community_comments WHERE "userId" = $1', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM community_posts WHERE "userId" = $1', [userId]).catch(() => {});

            // Analytics / Logs
            await this.userRepository.query('DELETE FROM user_activity_logs WHERE "userId" = $1', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM user_event_logs WHERE "userId" = $1', [userId]).catch(() => {});

            // Projects
            await this.userRepository.query('DELETE FROM project_applications WHERE user_id = $1', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM project_applications WHERE project_id IN (SELECT id FROM projects WHERE creator_id = $1)', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM projects WHERE creator_id = $1', [userId]).catch(() => {});

            // Mentorship
            await this.userRepository.query('DELETE FROM mentorship_relationships WHERE "mentorId" = $1 OR "menteeId" = $1', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM mentorship_programs WHERE "mentorId" = $1', [userId]).catch(() => {});
            
            // Announcements & Events
            await this.userRepository.query('DELETE FROM announcements WHERE "creatorId" = $1', [userId]).catch(() => {});
            // Clear event references just in case before deleting user
            await this.userRepository.query('DELETE FROM event_feedbacks WHERE "eventId" IN (SELECT id FROM events WHERE created_by = $1)', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM event_registrations WHERE "eventId" IN (SELECT id FROM events WHERE created_by = $1)', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM events WHERE created_by = $1', [userId]).catch(() => {});
            // -----------------------------------

            // 6. Delete other user-related records
            await this.userRepository.query('DELETE FROM event_registrations WHERE "userId" = $1', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM event_feedbacks WHERE "userId" = $1', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM club_members WHERE "userId" = $1', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM competition_submissions WHERE "userId" = $1', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM mentorship_applications WHERE "userId" = $1', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM feedback WHERE "userId" = $1', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM payment_verifications WHERE "userId" = $1', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM premium_memberships WHERE "userId" = $1', [userId]).catch(() => {});
            await this.userRepository.query('DELETE FROM premium_requests WHERE "userId" = $1', [userId]).catch(() => {});

            // 7. Delete notifications
            await this.userRepository.query('DELETE FROM notifications WHERE "userId" = $1', [userId]).catch(() => {});

            // 7. Finally delete user
            await this.userRepository.delete(userId);

            return { message: 'Hesabınız ve tüm verileriniz kalıcı olarak silindi.' };
        } catch (error) {
            console.error('Error deleting account:', error);
            throw new InternalServerErrorException('Hesap silinirken bir hata oluştu: ' + (error as any).message);
        }
    }

    async searchUsers(query: string) {
        if (!query || query.length < 1) return [];
        
        return this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.badges', 'badge')
            .where('user.name ILIKE :q OR user.surname ILIKE :q', { q: `%${query}%` })
            .select(['user.id', 'user.name', 'user.surname', 'user.profilePicture', 'user.title', 'badge.badge'])
            .limit(10)
            .getMany();
    }

    async getBranchRepresentatives() {
        return this.userRepository.find({
            where: { isBranchRepresentative: true },
            select: ['id', 'name', 'surname', 'profilePicture', 'branch']
        });
    }

    async findOne(id: number, currentUserId?: number) {
        const user = await this.userRepository.findOne({ 
            where: { id },
            relations: ['interests', 'badges']
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (currentUserId && currentUserId !== id) {
            this.recordProfileView(currentUserId, id).catch(e => console.error('Failed to record profile view:', e));
        }

        const { passwordHash, ...sanitized } = user;
        
        // Flatten interests to string array for easier use
        return {
            ...sanitized,
            interests: sanitized.interests ? sanitized.interests.map(i => i.interestCategory) : []
        } as any;
    }

    async recordProfileView(viewerId: number, viewedId: number) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const existingView = await this.profileViewRepository
            .createQueryBuilder('pv')
            .where('pv.viewerId = :viewerId', { viewerId })
            .andWhere('pv.viewedId = :viewedId', { viewedId })
            .andWhere('pv.createdAt >= :today', { today })
            .getOne();

        if (!existingView) {
            const view = new ProfileView();
            view.viewerId = viewerId;
            view.viewedId = viewedId;
            await this.profileViewRepository.save(view);
        }
    }

    async getRecentProfileViews(userId: number) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        return this.profileViewRepository
            .createQueryBuilder('pv')
            .leftJoinAndSelect('pv.viewer', 'viewer')
            .where('pv.viewedId = :userId', { userId })
            .andWhere('pv.createdAt >= :date', { date: sevenDaysAgo })
            .orderBy('pv.createdAt', 'DESC')
            .getMany();
    }

    @Cron(CronExpression.EVERY_DAY_AT_8PM)
    async handleAutomatedRetentionEmails() {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const viewsQuery = await this.profileViewRepository
            .createQueryBuilder('pv')
            .select('pv.viewedId', 'userId')
            .addSelect('COUNT(pv.id)', 'viewCount')
            .where('pv.createdAt >= :date', { date: threeDaysAgo })
            .groupBy('pv.viewedId')
            .getRawMany();

        for (const record of viewsQuery) {
            const user = await this.userRepository.findOne({ where: { id: record.userId } });
            if (!user) continue;
            
            // Eğer isPremium değilse ve uzun süredir profilini güncellememişse/girmemişse mail at
            if (!user.isPremium && user.updatedAt < threeDaysAgo) {
                // Şimdilik bu mail bildirimini durduruyoruz (User isteği)
                /*
                await this.emailService.sendProfileViewNotification(
                    user.email, 
                    user.name, 
                    parseInt(record.viewCount)
                );
                */
            }
        }
    }

    async findAll() {
        // Return all users for now, can be filtered by role/experience later
        return this.userRepository.find();
    }

    async updateProfile(userId: number, updates: {
        name?: string;
        surname?: string;
        title?: string;
        bio?: string;
        city?: string;
        profilePicture?: string;
        interests?: string[];
        memberCount?: number;
        eventCount?: number;
        clubInfo?: string;
        onboardingComplete?: boolean;
    }) {
        const { interests, ...rawProfile } = updates;
        const allowedKeys = ['name', 'surname', 'title', 'bio', 'city', 'profilePicture', 'memberCount', 'eventCount', 'clubInfo', 'onboardingComplete'] as const;
        const profileData: Record<string, unknown> = {};
        for (const key of allowedKeys) {
            if (rawProfile[key] !== undefined) {
                profileData[key] = rawProfile[key];
            }
        }

        if (Object.keys(profileData).length > 0) {
            await this.userRepository.update(userId, profileData as any);
        }

        // Update interests if provided
        if (interests && Array.isArray(interests)) {
            // Remove old interests
            await this.userInterestRepository.delete({ userId });

            // Insert new interests
            const interestEntities = interests.map((category: string) => {
                const interest = new UserInterest();
                interest.userId = userId;
                interest.interestCategory = category;
                return interest;
            });

            if (interestEntities.length > 0) {
                await this.userInterestRepository.save(interestEntities);
            }
        }

        // Clear AI recommendation caches so that new profile info (name, interests) reflects immediately
        try {
            await this.userRepository.query(`
                UPDATE user_streaks
                SET last_ai_recommendation = NULL,
                    last_ai_recommendation_date = NULL,
                    last_networking_ai_suggestion = NULL,
                    last_networking_ai_suggestion_date = NULL
                WHERE user_id = $1
            `, [userId]);
        } catch (e) {
            console.warn('[UsersService] Failed to clear AI cache:', e.message);
        }

        return this.findOne(userId);
    }

    async getUserInterests(userId: number) {
        return this.userInterestRepository.find({ where: { userId } });
    }

    async grantPremium(userId: number) {
        const user = await this.findOne(userId);
        await this.userRepository.update(userId, {
            isPremium: true,
            premiumStatus: 'active'
        });
        return { message: 'User upgraded to premium successfully' };
    }

    async revokePremium(userId: number) {
        const user = await this.findOne(userId);
        await this.userRepository.update(userId, {
            isPremium: false,
            premiumStatus: 'none'
        });
        return { message: 'User premium status revoked' };
    }

    async getAvailableForNetworking(currentUserId: number, excludeUserIds: number[] = [], searchQuery?: string) {
        // 1. Get current user to check role
        const currentUser = await this.userRepository.findOne({ where: { id: currentUserId } });
        if (!currentUser) throw new NotFoundException('User not found');

        const query = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.interests', 'interest')
            .where('user.id != :currentUserId', { currentUserId })
            .andWhere('user.isBanned = :isBanned', { isBanned: false })
            // .andWhere('user.onboardingComplete = :onboardingComplete', {
            //     onboardingComplete: true,
            // })
            // Exclude ADMIN from networking
            .andWhere('user.role != :adminRole', { adminRole: UserRole.ADMIN });

        // Exclude specific users (matches/connections)
        if (excludeUserIds.length > 0) {
            query.andWhere('user.id NOT IN (:...excludeUserIds)', { excludeUserIds });
        }

        // Search by name/surname if provided
        if (searchQuery && searchQuery.trim()) {
            query.andWhere(
                "(LOWER(user.name) LIKE :search OR LOWER(user.surname) LIKE :search OR LOWER(CONCAT(user.name, ' ', user.surname)) LIKE :search)",
                { search: `%${searchQuery.toLowerCase().trim()}%` }
            );
        }

        // 2. Filter by Role Separation -> RELAXED
        // Allow everyone to see everyone (except Admins)
        // If we want to restrict again, uncomment below:

        /*
        if (currentUser.role === UserRole.CLUB_PRESIDENT) {
            // Clubs only see Clubs
            query.andWhere('user.role = :role', { role: UserRole.CLUB_PRESIDENT });
        } else {
            // Users only see Users (and Premium Users), NOT Clubs
            query.andWhere('user.role IN (:...roles)', {
                roles: [UserRole.USER, UserRole.PREMIUM_USER],
            });
        }
        */

        // Instead, just ensure the target is not ADMIN (already handled above)
        // and allow cross-role networking (Student <-> Club).

        const users = await query
            .leftJoinAndSelect('user.badges', 'badge')
            .select([
                'user.id',
                'user.name',
                'user.surname',
                'user.title',
                'user.bio',
                'user.profilePicture',
                'user.city',
                'user.role',
                'user.memberCount',
                'user.eventCount',
                'user.clubInfo',
                'interest.id',
                'interest.interestCategory',
                'badge.id',
                'badge.badge'
            ])
            .take(200)
            .getMany();

        return users.map((user) => ({
            ...user,
            interests: user.interests
                ? user.interests.map((i) => i.interestCategory)
                : [],
        }));
    }

    async getUserEvents(userId: number) {
        // This requires EventRegistration entity which should be in events module
        // For now, return empty array - will be implemented when EventRegistration is properly set up
        return [];
    }

    async uploadAvatar(userId: number, file: any) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Delete old avatar if exists
        if (user.profilePicture) {
            const publicId = this.extractPublicId(user.profilePicture);
            if (publicId) {
                await this.cloudinaryService.deleteImage(publicId);
            }
        }

        // Upload new avatar
        const { url } = await this.cloudinaryService.uploadImage(file, 'avatars');

        // Update user profile picture
        await this.userRepository.update(userId, { profilePicture: url });

        return { url };
    }

    async exportUserData(userId: number) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['interests', 'badges']
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Gather other data
        const registrations = await this.userRepository.query('SELECT * FROM event_registrations WHERE "userId" = $1', [userId]);
        const clubs = await this.userRepository.query('SELECT * FROM club_members WHERE "userId" = $1', [userId]);
        const credits = await this.userRepository.query('SELECT * FROM credits WHERE "userId" = $1', [userId]);
        const transactions = await this.userRepository.query('SELECT * FROM credit_transactions WHERE "userId" = $1', [userId]);
        const mentorships = await this.userRepository.query('SELECT * FROM mentorship_applications WHERE "userId" = $1', [userId]);
        const feedback = await this.userRepository.query('SELECT * FROM feedback WHERE "userId" = $1', [userId]);

        const { passwordHash, verificationCode, resetPasswordCode, ...profile } = user;

        return {
            exportDate: new Date(),
            profile,
            interests: user.interests ? user.interests.map(i => i.interestCategory) : [],
            badges: user.badges || [],
            registrations,
            clubs,
            credits,
            transactions,
            mentorships,
            feedback
        };
    }
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async expirePremiumAccounts() {
        if (process.env.RUN_CRON !== 'true') return;
        try {
            const result = await this.userRepository.update(
                { 
                    isPremium: true, 
                    premiumExpiresAt: LessThan(new Date()) 
                },
                { 
                    isPremium: false, 
                    premiumStatus: 'none',
                    premiumExpiresAt: null as any
                }
            );
            if (result.affected && result.affected > 0) {
                console.log(`[Cron] Süresi dolan ${result.affected} hediye premium hesap normale çevrildi.`);
            }
        } catch (error) {
            console.error('[Cron] Hediye premium iptali sırasında hata oluştu:', error);
        }
    }

    private extractPublicId(url: string): string | null {
        const match = url.match(/\/v\d+\/(.+)\.\w+$/);
        return match ? match[1] : null;
    }
}
