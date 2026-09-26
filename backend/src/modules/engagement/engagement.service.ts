import {
    Injectable,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, In } from 'typeorm';
import { UserStreak } from './entities/user-streak.entity';
import { UserBadge, BadgeType } from './entities/user-badge.entity';
import { WeeklyChallengeCompletion, ChallengeKey } from './entities/weekly-challenge-completion.entity';
import { DailyAnswer } from './entities/daily-answer.entity';
import { CreditsService } from '../credits/credits.service';
import { TransactionType } from '../../common/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import { Credit } from '../credits/entities/credit.entity';
import { Connection } from '../networking/entities/connection.entity';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiService } from '../../common/services/ai.service';
import { Event } from '../events/entities/event.entity';
import { MentorshipProgram } from '../mentorship/entities/mentorship-program.entity';
import { Competition } from '../competitions/entities/competition.entity';
import { EventRegistration } from '../events/entities/event-registration.entity';
import { ClubMember } from '../clubs/entities/club-member.entity';
import { MentorshipApplication } from '../mentorship/entities/mentorship-application.entity';
import { CompetitionSubmission } from '../competitions/entities/competition-submission.entity';

/** All available weekly challenges with their credit rewards */
export const WEEKLY_CHALLENGES: { key: ChallengeKey; label: string; credits: number }[] = [
    { key: 'register_event', label: 'Bu hafta bir etkinliğe kaydol', credits: 3 },
    { key: 'send_connection', label: '3 yeni bağlantı isteği gönder', credits: 4 },
    { key: 'complete_profile', label: 'Profili %100 tamamla', credits: 5 },
    { key: 'join_club', label: 'Bir kulübe katıl', credits: 2 },
    { key: 'apply_mentorship', label: 'Bir mentöre başvur', credits: 3 },
];

export const DAILY_GOAL_POOL = [
    { key: 'view_events', label: 'Yeni etkinliklere göz at' },
    { key: 'create_post', label: 'Toplulukta bir an paylaş' },
    { key: 'send_message', label: 'Birine mesaj at' },
    { key: 'view_clubs', label: 'Kulüpleri incele' },
    { key: 'send_connection', label: 'Yeni bir bağlantı isteği gönder' },
    { key: 'view_leaderboard', label: 'Sıralamadaki yerini kontrol et' },
];

const BADGE_DEFINITIONS: { badge: BadgeType; label: string; emoji: string; description: string }[] = [
    { badge: 'first_login', label: 'İlk Adım', emoji: '🌱', description: 'Bondle\'a hoş geldin!' },
    { badge: 'streak_3', label: '3 Günlük Seri', emoji: '🔥', description: '3 gün üst üste giriş yaptın!' },
    { badge: 'streak_7', label: '7 Günlük Seri', emoji: '⚡', description: '7 gün üst üste giriş yaptın!' },
    { badge: 'streak_30', label: '30 Günlük Seri', emoji: '💎', description: '30 gün üst üste giriş yaptın!' },
    { badge: 'networker', label: 'Networkçi', emoji: '🤝', description: '5 bağlantı kurdun!' },
    { badge: 'super_networker', label: 'Süper Networkçi', emoji: '🌐', description: '20 bağlantı kurdun!' },
    { badge: 'event_goer', label: 'Etkinlik Dostu', emoji: '📅', description: '3 etkinliğe katıldın!' },
    { badge: 'event_enthusiast', label: 'Etkinlik Tutkunu', emoji: '🎉', description: '10 etkinliğe katıldın!' },
    { badge: 'mentee', label: 'Mentee', emoji: '🎓', description: 'Bir mentöre başvurdun!' },
    { badge: 'competitor', label: 'Yarışmacı', emoji: '🏆', description: 'Bir yarışmaya katıldın!' },
    { badge: 'club_member', label: 'Kulüp Üyesi', emoji: '👥', description: 'Bir kulübe üye oldun!' },
    { badge: 'profile_complete', label: 'Tam Profil', emoji: '⭐', description: 'Profilini %100 tamamladın!' },
    { badge: 'premium', label: 'Premium Üye', emoji: '💫', description: 'Bondle Premium üyesisin!' },
];

/** Returns ISO week key like "2026-W18" */
function getWeekKey(date: Date = new Date()): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Returns today's date string in YYYY-MM-DD format */
function todayString(): string {
    return new Date().toISOString().split('T')[0];
}

@Injectable()
export class EngagementService implements OnModuleInit {
    constructor(
        @InjectRepository(UserStreak)
        private streakRepo: Repository<UserStreak>,
        @InjectRepository(UserBadge)
        private badgeRepo: Repository<UserBadge>,
        @InjectRepository(WeeklyChallengeCompletion)
        private challengeRepo: Repository<WeeklyChallengeCompletion>,
        @InjectRepository(DailyAnswer)
        private dailyAnswerRepo: Repository<DailyAnswer>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(Credit)
        private creditRepo: Repository<Credit>,
        @InjectRepository(Connection)
        private connectionRepo: Repository<Connection>,
        @InjectRepository(Event)
        private eventRepo: Repository<Event>,
        @InjectRepository(MentorshipProgram)
        private mentorshipRepo: Repository<MentorshipProgram>,
        @InjectRepository(Competition)
        private competitionRepo: Repository<Competition>,
        @InjectRepository(EventRegistration)
        private eventRegistrationRepo: Repository<EventRegistration>,
        @InjectRepository(ClubMember)
        private clubMemberRepo: Repository<ClubMember>,
        @InjectRepository(MentorshipApplication)
        private mentorshipApplicationRepo: Repository<MentorshipApplication>,
        @InjectRepository(CompetitionSubmission)
        private competitionSubmissionRepo: Repository<CompetitionSubmission>,
        private creditsService: CreditsService,
        private notificationsService: NotificationsService,
        private configService: ConfigService,
        private aiService: AiService,
    ) { }

    async onModuleInit() {
        if (process.env.RUN_SEED !== 'true') {
            return;
        }
        
        // Auto-fix for missing columns in user_streaks table
        let queryRunner;
        try {
            queryRunner = this.streakRepo.manager.connection.createQueryRunner();
            const table = await queryRunner.getTable('user_streaks');
            
            if (table) {
                const columnsToAdd = [
                    { name: 'user_id', oldName: 'userId', type: 'int' },
                    { name: 'current_streak', oldName: 'currentStreak', type: 'int' },
                    { name: 'longest_streak', oldName: 'longestStreak', type: 'int' },
                    { name: 'last_login_date', oldName: 'lastLoginDate', type: 'date' },
                    { name: 'total_days_active', oldName: 'totalDaysActive', type: 'int' },
                    { name: 'user_referral_code_generated', oldName: 'userReferralCodeGenerated', type: 'boolean' },
                    { name: 'last_ai_recommendation', oldName: 'lastAiRecommendation', type: 'text' },
                    { name: 'last_ai_recommendation_date', oldName: 'lastAiRecommendationDate', type: 'timestamp' },
                    { name: 'last_networking_ai_suggestion', oldName: 'lastNetworkingAiSuggestion', type: 'text', isNullable: true },
                    { name: 'last_networking_ai_suggestion_date', oldName: 'lastNetworkingAiSuggestionDate', type: 'timestamp', isNullable: true },
                    { name: 'daily_goals', oldName: 'dailyGoals', type: 'text', isNullable: true },
                    { name: 'daily_goals_date', oldName: 'dailyGoalsDate', type: 'date', isNullable: true }
                ];

                for (const col of columnsToAdd) {
                    const hasNewColumn = table.findColumnByName(col.name);
                    const hasOldColumn = table.findColumnByName(col.oldName);

                    if (!hasNewColumn) {
                        if (hasOldColumn) {
                            console.log(`[EngagementService] Renaming column: ${col.oldName} -> ${col.name}`);
                            await queryRunner.query(`ALTER TABLE "user_streaks" RENAME COLUMN "${col.oldName}" TO "${col.name}"`);
                        } else {
                            console.log(`[EngagementService] Adding missing column: ${col.name}`);
                            await queryRunner.query(`ALTER TABLE "user_streaks" ADD COLUMN "${col.name}" ${col.type}`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[EngagementService] Failed to check/add missing columns:', error.message);
        } finally {
            if (queryRunner) await queryRunner.release();
        }
    }

    // ──────────────────────────────────────────
    // STREAK
    // ──────────────────────────────────────────

    /** Call on every authenticated request (or login) to update the streak */
    async recordDailyLogin(userId: number): Promise<{ streak: UserStreak; creditsAwarded: number; newBadges: BadgeType[] }> {
        const today = todayString();
        let streak = await this.streakRepo.findOne({ where: { userId } });
        const newBadges: BadgeType[] = [];
        let creditsAwarded = 0;

        if (!streak) {
            // First ever login
            streak = this.streakRepo.create({
                userId,
                currentStreak: 1,
                longestStreak: 1,
                lastLoginDate: today,
                totalDaysActive: 1,
            });
            streak = await this.streakRepo.save(streak);

            // First login badge
            const earned = await this.awardBadge(userId, 'first_login');
            if (earned) newBadges.push('first_login');

            // +1 credits for first login
            creditsAwarded = 1;
            await this.creditsService.addCredits(userId, 1, TransactionType.MANUAL_ADJUSTMENT, '🌱 Bondle\'a hoş geldin! +1 kredi');
            return { streak, creditsAwarded, newBadges };
        }

        // Already logged in today — no change
        if (streak.lastLoginDate === today) {
            return { streak, creditsAwarded: 0, newBadges };
        }

        // Check if yesterday
        const lastDate = new Date(streak.lastLoginDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (streak.lastLoginDate === yesterdayStr) {
            // Consecutive day
            streak.currentStreak += 1;
        } else {
            // Streak broken
            streak.currentStreak = 1;
        }

        streak.lastLoginDate = today;
        streak.totalDaysActive += 1;
        if (streak.currentStreak > streak.longestStreak) {
            streak.longestStreak = streak.currentStreak;
        }
        streak = await this.streakRepo.save(streak);

        // Credits based on streak
        const baseCredits = 1;
        let bonusCredits = 0;

        if (streak.currentStreak >= 30) {
            bonusCredits = 8;
        } else if (streak.currentStreak >= 7) {
            bonusCredits = 4;
        } else if (streak.currentStreak >= 3) {
            bonusCredits = 2;
        }

        creditsAwarded = baseCredits + bonusCredits;
        await this.creditsService.addCredits(
            userId,
            creditsAwarded,
            TransactionType.MANUAL_ADJUSTMENT,
            `🔥 ${streak.currentStreak} günlük seri bonusu! +${creditsAwarded} kredi`,
        );

        // Streak badges
        if (streak.currentStreak >= 3) {
            const earned = await this.awardBadge(userId, 'streak_3');
            if (earned) newBadges.push('streak_3');
        }
        if (streak.currentStreak >= 7) {
            const earned = await this.awardBadge(userId, 'streak_7');
            if (earned) newBadges.push('streak_7');
        }
        if (streak.currentStreak >= 30) {
            const earned = await this.awardBadge(userId, 'streak_30');
            if (earned) newBadges.push('streak_30');
        }

        // Notify on streak milestones
        if ([3, 7, 14, 30].includes(streak.currentStreak)) {
            await this.notificationsService.createNotification(
                userId,
                `🔥 ${streak.currentStreak} Günlük Seri!`,
                `Harika iş! ${streak.currentStreak} gün üst üste Bondle'dasın. +${creditsAwarded} kredi kazandın!`,
                'streak_milestone',
            );
        }

        // Ensure user has a referral code
        if (!streak.userReferralCodeGenerated) {
            const user = await this.userRepo.findOne({ where: { id: userId } });
            if (user && !user.referralCode) {
                user.referralCode = this.generateReferralCode(user.name, user.id);
                await this.userRepo.save(user);
            }
            streak.userReferralCodeGenerated = true;
            await this.streakRepo.save(streak);
        }

        return { streak, creditsAwarded, newBadges };
    }

    private generateReferralCode(name: string, id: number): string {
        const cleanName = name.replace(/[^A-Z0-9]/gi, '').toUpperCase().substring(0, 4);
        const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `UNV-${cleanName}${id}${randomStr}`.substring(0, 12);
    }

    async useReferralCode(userId: number, code: string): Promise<{ success: boolean; message: string }> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new Error('Kullanıcı bulunamadı');
        
        // 3. Time check: Only "new" users can use a referral code (e.g., within 24 hours of registration)
        const now = new Date();
        const userCreatedAt = new Date(user.createdAt);
        const diffInHours = Math.abs(now.getTime() - userCreatedAt.getTime()) / 36e5;

        if (diffInHours > 24) {
            return { success: false, message: 'Referans kodu sadece yeni hesaplar tarafından ilk 24 saat içinde kullanılabilir.' };
        }

        const inviter = await this.userRepo.findOne({ where: { referralCode: code.toUpperCase() } });
        if (!inviter) {
            return { success: false, message: 'Geçersiz referans kodu.' };
        }

        if (inviter.id === userId) {
            return { success: false, message: 'Kendi kodunuzu kullanamazsınız.' };
        }

        // Link users
        user.referredById = inviter.id;
        await this.userRepo.save(user);

        // Reward both
        const rewardAmount = 5;
        
        // Reward Invitee
        await this.creditsService.addCredits(
            userId, 
            rewardAmount, 
            TransactionType.MANUAL_ADJUSTMENT, 
            `🎁 Referans ödülü! +${rewardAmount} kredi`
        );

        // Reward Inviter
        await this.creditsService.addCredits(
            inviter.id, 
            rewardAmount, 
            TransactionType.MANUAL_ADJUSTMENT, 
            `🎊 Davetinle bir arkadaşın Bondle'a katıldı! +${rewardAmount} kredi`
        );

        // Notify Inviter
        await this.notificationsService.createNotification(
            inviter.id,
            '🎁 Davet Ödülü!',
            `${user.name} davet kodunu kullandı. +${rewardAmount} kredi hesabına eklendi!`,
            'referral_reward'
        );

        return { success: true, message: `Harika! ${rewardAmount} kredi kazandın.` };
    }

    async getStreak(userId: number): Promise<UserStreak | null> {
        return this.streakRepo.findOne({ where: { userId } });
    }

    // ──────────────────────────────────────────
    // BADGES
    // ──────────────────────────────────────────

    /** Awards badge if not already earned. Returns true if newly earned. */
    async awardBadge(userId: number, badge: BadgeType): Promise<boolean> {
        const existing = await this.badgeRepo.findOne({ where: { userId, badge } });
        if (existing) return false;

        const newBadge = this.badgeRepo.create({ userId, badge, earned: true });
        await this.badgeRepo.save(newBadge);

        // Create notification
        const def = BADGE_DEFINITIONS.find(b => b.badge === badge);
        if (def) {
            await this.notificationsService.createNotification(
                userId,
                `${def.emoji} Yeni Rozet: ${def.label}`,
                def.description,
                'badge_earned',
            );
        }

        return true;
    }

    async getUserBadges(userId: number): Promise<UserBadge[]> {
        return this.badgeRepo.find({ where: { userId }, order: { earnedAt: 'DESC' } });
    }

    async markBadgesSeen(userId: number): Promise<void> {
        await this.badgeRepo.update({ userId, earned: false }, { earned: true });
    }

    /** Returns badge definitions enriched with earned status */
    async getBadgeStatus(userId: number) {
        await this.evaluateDynamicBadges(userId);
        const earned = await this.getUserBadges(userId);
        const earnedKeys = new Set(earned.map(b => b.badge));

        return BADGE_DEFINITIONS.map(def => ({
            ...def,
            earned: earnedKeys.has(def.badge),
            earnedAt: earned.find(b => b.badge === def.badge)?.earnedAt || null,
        }));
    }

    // ──────────────────────────────────────────
    // WEEKLY CHALLENGES
    // ──────────────────────────────────────────

    async getWeeklyChallenges(userId: number) {
        const weekKey = getWeekKey();
        const completions = await this.challengeRepo.find({ where: { userId, weekKey } });
        const completedKeys = new Set(completions.map(c => c.challengeKey));

        return WEEKLY_CHALLENGES.map(ch => ({
            ...ch,
            completed: completedKeys.has(ch.key),
            completedAt: completions.find(c => c.challengeKey === ch.key)?.completedAt || null,
        }));
    }

    /** Called from other services when an action is performed */
    async completeChallenge(userId: number, challengeKey: ChallengeKey): Promise<boolean> {
        const weekKey = getWeekKey();
        const existing = await this.challengeRepo.findOne({ where: { userId, challengeKey, weekKey } });
        if (existing) return false;

        const challenge = WEEKLY_CHALLENGES.find(c => c.key === challengeKey);
        if (!challenge) return false;

        const completion = this.challengeRepo.create({
            userId,
            challengeKey,
            weekKey,
            creditsAwarded: 0, // Individual challenges no longer award credits directly
        });
        await this.challengeRepo.save(completion);

        // Check if all weekly challenges are now completed
        const allCompletions = await this.challengeRepo.find({ where: { userId, weekKey } });
        const isAllCompleted = allCompletions.length >= WEEKLY_CHALLENGES.length;

        if (isAllCompleted) {
            const rewardCredits = 15;
            await this.creditsService.addCredits(
                userId,
                rewardCredits,
                TransactionType.MANUAL_ADJUSTMENT,
                `🎯 Tüm haftalık görevleri tamamladın! +${rewardCredits} kredi`,
            );

            await this.notificationsService.createNotification(
                userId,
                '🏆 Haftalık Görev Ustası!',
                `Bu haftanın tüm görevlerini tamamladın ve +${rewardCredits} kredi kazandın!`,
                'challenge_complete',
            );
        } else {
            // Just notify completion without credits
            await this.notificationsService.createNotification(
                userId,
                '🎯 Görev Tamamlandı!',
                `"${challenge.label}" görevini tamamladın. Hepsini bitirerek 15 krediyi kap!`,
                'challenge_complete',
            );
        }

        return true;
    }

    // ──────────────────────────────────────────
    // DASHBOARD SUMMARY
    // ──────────────────────────────────────────

    async getDailyGoals(userId: number) {
        const today = todayString();
        let streak = await this.streakRepo.findOne({ where: { userId } });

        if (!streak) {
            streak = this.streakRepo.create({ userId, currentStreak: 0, longestStreak: 0 });
            await this.streakRepo.save(streak);
        }

        // If no goals for today, generate them
        if (streak.dailyGoalsDate !== today || !streak.dailyGoals) {
            // Pick 3 random goals
            const shuffled = [...DAILY_GOAL_POOL].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 3).map(g => ({ ...g, completed: false }));
            
            streak.dailyGoals = JSON.stringify(selected);
            streak.dailyGoalsDate = today;
            await this.streakRepo.save(streak);
        }

        return JSON.parse(streak.dailyGoals);
    }

    async completeDailyGoal(userId: number, goalKey: string) {
        const today = todayString();
        const streak = await this.streakRepo.findOne({ where: { userId } });
        if (!streak || streak.dailyGoalsDate !== today || !streak.dailyGoals) return null;

        const goals = JSON.parse(streak.dailyGoals);
        const goalIndex = goals.findIndex(g => g.key === goalKey);

        if (goalIndex === -1 || goals[goalIndex].completed) return goals;

        goals[goalIndex].completed = true;
        streak.dailyGoals = JSON.stringify(goals);
        await this.streakRepo.save(streak);

        // Reward with small credit (e.g., 1 credit per goal)
        await this.creditsService.addCredits(
            userId,
            1,
            TransactionType.MANUAL_ADJUSTMENT,
            `🎯 Günlük hedef tamamlandı: "${goals[goalIndex].label}" +1 kredi`
        );

        return goals;
    }

    private async evaluateDynamicBadges(userId: number, user?: User) {
        if (!user) user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) return;

        const [
            connections,
            events,
            clubs,
            mentorships,
            competitions
        ] = await Promise.all([
            this.connectionRepo.count({
                where: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            }),
            this.eventRegistrationRepo.count({ where: { userId } }),
            this.clubMemberRepo.count({ where: { userId } }),
            this.mentorshipApplicationRepo.count({ where: { userId } }),
            this.competitionSubmissionRepo.count({ where: { userId } }),
        ]);

        if (connections >= 5) await this.awardBadge(userId, 'networker');
        if (connections >= 20) await this.awardBadge(userId, 'super_networker');

        if (events >= 1) await this.awardBadge(userId, 'event_goer');
        if (events >= 10) await this.awardBadge(userId, 'event_enthusiast');

        if (mentorships >= 1) await this.awardBadge(userId, 'mentee');
        if (competitions >= 1) await this.awardBadge(userId, 'competitor');
        if (clubs >= 1) {
            await this.awardBadge(userId, 'club_member');
            await this.completeChallenge(userId, 'join_club').catch(() => {});
        }
        
        if (user.isPremium) await this.awardBadge(userId, 'premium');

        if (user.profilePicture && user.title && user.city && user.bio) {
            await this.awardBadge(userId, 'profile_complete');
            await this.completeChallenge(userId, 'complete_profile').catch(() => {});
        }
    }

    async getEngagementSummary(userId: number) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        await this.evaluateDynamicBadges(userId, user);

        const [streak, badges, challenges, dailyGoals] = await Promise.all([
            this.getStreak(userId),
            this.getBadgeStatus(userId),
            this.getWeeklyChallenges(userId),
            this.getDailyGoals(userId),
        ]);

        // Auto-generate referral code if missing
        let referralCode = user?.referralCode;
        if (user && !referralCode) {
            referralCode = this.generateReferralCode(user.name, user.id);
            user.referralCode = referralCode;
            await this.userRepo.save(user);
        }

        const newBadges = await this.badgeRepo.find({ where: { userId, earned: false } });

        return {
            streak: streak || { currentStreak: 0, longestStreak: 0, totalDaysActive: 0 },
            badges,
            challenges,
            dailyGoals,
            newBadgesCount: newBadges.length,
            referralCode,
        };
    }

    // ──────────────────────────────────────────
    // RANKING
    // ──────────────────────────────────────────

    async getRanking(currentUserId: number, limit: number = 20) {
        const totalParticipantsRaw = await this.userRepo.query(`
            SELECT COUNT(*) as count FROM users WHERE role != 'admin' AND "isBanned" = false
        `);
        const totalParticipants = parseInt(totalParticipantsRaw[0].count, 10);

        if (totalParticipants === 0) return { ranking: [], currentUser: null, totalParticipants: 0 };

        const rawQuery = `
            SELECT 
                u.id as "userId",
                u.name as "name",
                u.surname as "surname",
                u."profilePicture" as "profilePicture",
                u."isPremium" as "isPremium",
                COALESCE(s."current_streak", 0)::int as "currentStreak",
                COALESCE(s."total_days_active", 0)::int as "totalDaysActive",
                COALESCE(b.badge_count, 0)::int as "badges",
                COALESCE(c.conn_count, 0)::int as "connections",
                COALESCE(cr."availableCredits", 0)::int as "availableCredits",
                (COALESCE(s."current_streak", 0) * 4) + (COALESCE(b.badge_count, 0) * 3) + (COALESCE(c.conn_count, 0) * 2) + COALESCE(s."total_days_active", 0)::int as "score"
            FROM users u
            LEFT JOIN user_streaks s ON s."user_id" = u.id
            LEFT JOIN (
                SELECT "userId", COUNT(*) as badge_count FROM user_badges GROUP BY "userId"
            ) b ON b."userId" = u.id
            LEFT JOIN (
                SELECT user_id, SUM(cnt) as conn_count FROM (
                    SELECT "user1Id" as user_id, COUNT(*) as cnt FROM connections GROUP BY "user1Id"
                    UNION ALL
                    SELECT "user2Id" as user_id, COUNT(*) as cnt FROM connections GROUP BY "user2Id"
                ) combined_conns GROUP BY user_id
            ) c ON c.user_id = u.id
            LEFT JOIN credits cr ON cr."userId" = u.id
            WHERE u.role != 'admin' AND u."isBanned" = false
        `;
        
        // 1. Get Top N Ranking
        const topNRaw = await this.userRepo.query(`
            ${rawQuery}
            ORDER BY "score" DESC
            LIMIT $1
        `, [limit]);

        const ranking = topNRaw.map((entry, index) => ({
            ...entry,
            rank: index + 1,
            currentStreak: parseInt(entry.currentStreak || 0),
            totalDaysActive: parseInt(entry.totalDaysActive || 0),
            badges: parseInt(entry.badges || 0),
            connections: parseInt(entry.connections || 0),
            availableCredits: parseInt(entry.availableCredits || 0),
            score: parseInt(entry.score || 0)
        }));

        // 2. Find Current User's position
        let currentUser = ranking.find(u => u.userId === currentUserId) || null;

        if (!currentUser && currentUserId) {
            // User is not in top N, so fetch their specific rank
            const userScoreRaw = await this.userRepo.query(`
                SELECT "score" FROM (${rawQuery}) as ranked_users WHERE "userId" = $1
            `, [currentUserId]);
            
            if (userScoreRaw.length > 0) {
                const userScore = userScoreRaw[0].score;
                const rankCount = await this.userRepo.query(`
                    SELECT COUNT(*) as rank FROM (${rawQuery}) as ranked_users WHERE "score" > $1
                `, [userScore]);
                
                const rank = parseInt(rankCount[0].rank) + 1;
                const userDetailsRaw = await this.userRepo.query(`
                    SELECT * FROM (${rawQuery}) as ranked_users WHERE "userId" = $1
                `, [currentUserId]);
                
                if (userDetailsRaw.length > 0) {
                    const ud = userDetailsRaw[0];
                    currentUser = {
                        ...ud,
                        rank,
                        currentStreak: parseInt(ud.currentStreak || 0),
                        totalDaysActive: parseInt(ud.totalDaysActive || 0),
                        badges: parseInt(ud.badges || 0),
                        connections: parseInt(ud.connections || 0),
                        availableCredits: parseInt(ud.availableCredits || 0),
                        score: parseInt(ud.score || 0)
                    };
                }
            }
        }

        return {
            ranking,
            currentUser,
            totalParticipants,
        };
    }

    async getSmartRecommendations(userId: number) {
        const currentUser = await this.userRepo.findOne({ where: { id: userId }, relations: ['interests'] });
        if (!currentUser) return [];

        // Check cache in UserStreak
        let streak = await this.streakRepo.findOne({ where: { userId } });
        const now = new Date();
        const CACHE_HOURS = 12;

        if (streak?.lastAiRecommendation && streak.lastAiRecommendationDate) {
            const hoursSinceUpdate = (now.getTime() - streak.lastAiRecommendationDate.getTime()) / (1000 * 60 * 60);
            if (hoursSinceUpdate < CACHE_HOURS) {
                try {
                    const cached = JSON.parse(streak.lastAiRecommendation);
                    
                    // Validate cached items still exist in DB (filter deleted ones)
                    const [liveEvents, liveMentorships, liveCompetitions] = await Promise.all([
                        this.eventRepo.find({ where: { status: 'approved' as any, date: MoreThanOrEqual(now) }, select: ['id'] }),
                        this.mentorshipRepo.find({ where: { applicationEndDate: MoreThanOrEqual(now) }, select: ['id'] }),
                        this.competitionRepo.find({ where: { deadline: MoreThanOrEqual(now) }, select: ['id'] }),
                    ]);
                    const liveEventIds = new Set(liveEvents.map(e => e.id));
                    const liveMentorshipIds = new Set(liveMentorships.map(m => m.id));
                    const liveCompetitionIds = new Set(liveCompetitions.map(c => c.id));

                    const validated = cached.filter(rec => {
                        if (!rec?.item?.id) return false;
                        if (rec.type === 'event') return liveEventIds.has(rec.item.id);
                        if (rec.type === 'mentorship') return liveMentorshipIds.has(rec.item.id);
                        if (rec.type === 'competition') return liveCompetitionIds.has(rec.item.id);
                        return false;
                    });

                    // Extra layer: Deduplicate cached items too
                    const seenInCache = new Set<string>();
                    const uniqueValidated = validated.filter(rec => {
                        const key = `${rec.type}-${rec.item.id}`;
                        if (seenInCache.has(key)) return false;
                        seenInCache.add(key);
                        return true;
                    });

                    // If items were removed from cache or duplicates found, update it
                    if (uniqueValidated.length !== cached.length) {
                        streak.lastAiRecommendation = JSON.stringify(uniqueValidated);
                        await this.streakRepo.save(streak);
                    }

                    return uniqueValidated;
                } catch (e) {
                    console.error('Failed to parse cached recommendations');
                }
            }
        }

        // Fetch all active opportunities
        const [events, mentorships, competitions] = await Promise.all([
            this.eventRepo.find({ 
                where: { status: 'approved' as any, date: MoreThanOrEqual(now) }, 
                order: { date: 'ASC' }, 
                take: 10 
            }),
            this.mentorshipRepo.find({ 
                where: { applicationEndDate: MoreThanOrEqual(now) },
                take: 10 
            }),
            this.competitionRepo.find({ 
                where: { deadline: MoreThanOrEqual(now) },
                take: 10 
            })
        ]);

        const allItems = [
            ...events.map(e => ({ type: 'event', id: e.id, title: e.title, eventType: e.eventType })),
            ...mentorships.map(m => ({ type: 'mentorship', id: m.id, title: m.title })),
            ...competitions.map(c => ({ type: 'competition', id: c.id, title: c.title }))
        ];

        if (allItems.length === 0) return [];

        const prompt = `
        Sen bir üniversite kariyer ve gelişim asistanısın. Kullanıcının profilini analiz ederek ona en uygun 4 BENZERSİZ fırsatı (etkinlik, mentorluk veya yarışma) seç.
        Mükerrerlik olmamalı, her fırsatı en fazla bir kez seçebilirsin.
        
        Kullanıcı: ${currentUser.name}
        İlgi Alanları: ${currentUser.interests?.map(i => i.interestCategory).join(', ') || 'Belirtilmedi'}
        
        Fırsatlar: ${JSON.stringify(allItems.slice(0, 20))}
        
        Görev: Kullanıcı için en iyi 4 fırsatı seç ve her biri için neden bu fırsatı önerdiğini açıklayan KISA (max 12 kelime), KİŞİSEL ve etkileyici bir cümle yaz. 
        Cümlelerin hepsinde aynı kalıpları kullanma, her biri farklı ve samimi olsun. 
        Örneğin: "Bu etkinlik tam senin ilgi alanın olan teknoloji trendlerini kapsıyor!"
        
        Yanıtı sadece JSON ver (markdown kullanma): [{ "type": "event|mentorship|competition", "id": number, "reason": "string" }]
        `;

        try {
            const text = await this.aiService.generateResponse(prompt);
            
            // Robust JSON extraction
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            const cleanedJson = jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, '').trim();
            
            const recommendations = JSON.parse(cleanedJson);

            // Map back to full objects
            const seenIds = new Set<string>();
            const fullRecommendations = recommendations.map(rec => {
                const source = (rec.type === 'event' ? events : rec.type === 'mentorship' ? mentorships : competitions) as any[];
                const item = source.find(i => Number(i.id) === Number(rec.id));
                if (!item) return null;

                const itemKey = `${rec.type}-${rec.id}`;
                if (seenIds.has(itemKey)) return null;
                seenIds.add(itemKey);

                const imageUrl = rec.type === 'event' ? item.posterImage : (item.imageUrl || item.posterImage);

                return {
                    type: rec.type,
                    item: { ...item, imageUrl },
                    recommendationReason: rec.reason
                };
            }).filter(r => r !== null);

            // Update cache
            if (!streak) {
                streak = this.streakRepo.create({ userId });
            }
            streak.lastAiRecommendation = JSON.stringify(fullRecommendations);
            streak.lastAiRecommendationDate = now;
            await this.streakRepo.save(streak);

            return fullRecommendations;

        } catch (error) {
            console.error('Smart Recommendations failed, falling back to basic:', error.message);
            // Fallback with template recommendations (don't cache these)
            return allItems.slice(0, 4).map((item, idx) => {
                const fullItem = ((item.type === 'event' ? events : item.type === 'mentorship' ? mentorships : competitions) as any[]).find(i => Number(i.id) === Number(item.id));
                const reasons = {
                    event: [
                        'Bu etkinlik tam sana göre, kaçırma! 🎯',
                        'İlgi alanlarınla örtüşen harika bir fırsat!',
                        'Topluluğun en çok ilgi gören etkinliklerinden biri!',
                        'Kariyerine yön verebilecek önemli bir etkinlik!'
                    ],
                    mentorship: [
                        'Deneyimli mentorlardan bire bir rehberlik al!',
                        'Kariyer hedeflerine ulaşmak için harika bir fırsat!',
                        'Alanında uzman kişilerle tanışma şansı!',
                        'Profesyonel gelişimin için birebir!'
                    ],
                    competition: [
                        'Yeteneklerini sergileyebileceğin bir yarışma!',
                        'Kendini kanıtlamak için mükemmel bir fırsat!',
                        'Ödüllü yarışmada yerini al!',
                        'Ekip kurarak katılabileceğin harika bir yarışma!'
                    ]
                };
                const typeReasons = reasons[item.type] || reasons.event;
                return {
                    type: item.type,
                    item: fullItem ? { ...fullItem, imageUrl: item.type === 'event' ? fullItem.posterImage : (fullItem.imageUrl || fullItem.posterImage) } : null,
                    recommendationReason: typeReasons[idx % typeReasons.length]
                };
            }).filter(r => r.item);
        }
    }

    async submitDailyAnswer(userId: number, question: string, answer: string) {
        const entry = this.dailyAnswerRepo.create({
            userId,
            question,
            answer,
        });
        return this.dailyAnswerRepo.save(entry);
    }

    async getDailyAnswers() {
        const answers = await this.dailyAnswerRepo.find({
            order: { createdAt: 'DESC' },
            take: 50,
        });

        const userIds = [...new Set(answers.map(a => a.userId))];
        let users = [];
        if (userIds.length > 0) {
            users = await this.userRepo.find({
                where: {
                    id: In(userIds)
                }
            });
        }

        return answers.map(answer => {
            const user = users.find(u => u.id === answer.userId);
            return {
                answer_id: answer.id,
                answer_question: answer.question,
                answer_answer: answer.answer,
                answer_createdAt: answer.createdAt,
                answer_rank: answer.rank,
                user_id: user?.id,
                user_name: user?.name,
                user_surname: user?.surname,
                user_email: user?.email,
                user_profilePicture: user?.profilePicture,
                user_avatar: user?.avatar,
            };
        });
    }

    async setDailyAnswerWinner(answerId: number, rank: number) {
        const answer = await this.dailyAnswerRepo.findOne({ where: { id: answerId } });
        if (!answer) throw new Error('Answer not found');

        answer.rank = rank;
        await this.dailyAnswerRepo.save(answer);

        // Send Notification
        const rankText = rank === 1 ? '1.' : rank === 2 ? '2.' : '3.';
        await this.notificationsService.createNotification(
            answer.userId,
            'Tebrikler! Günün Kazananı Sensin 🏆',
            `Günün sorusuna verdiğin yanıtla ${rankText} oldun. Harika bir iş çıkardın!`,
            'daily_winner',
            answer.id
        );

        return answer;
    }

    async getDailyWinners() {
        // En son seçilen kazananları getir.
        const winners = await this.dailyAnswerRepo.find({
            where: { rank: MoreThanOrEqual(1) },
            order: { createdAt: 'DESC' },
            take: 50 
        });

        if (winners.length === 0) return [];

        // Türkiye saatine (UTC+3) göre bugünün tarihini string olarak al (YYYY-MM-DD)
        const getTurkeyDateString = (date: Date) => {
            return new Date(date.getTime() + 3 * 60 * 60 * 1000).toISOString().split('T')[0];
        };

        const todayStr = getTurkeyDateString(new Date());

        // Yalnızca BUGÜN oluşturulmuş yanıtların kazananlarını al
        const todayWinners = winners.filter(w => getTurkeyDateString(w.createdAt) === todayStr);

        // Rank'e göre 1, 2, 3 sıralayalım
        const latestWinners = todayWinners
            .sort((a, b) => a.rank - b.rank)
            .slice(0, 3);

        const userIds = [...new Set(latestWinners.map(w => w.userId))];
        let users = [];
        if (userIds.length > 0) {
            users = await this.userRepo.find({ where: { id: In(userIds) } });
        }

        return latestWinners.map(winner => {
            const user = users.find(u => u.id === winner.userId);
            return {
                id: winner.id,
                rank: winner.rank,
                question: winner.question,
                answer: winner.answer,
                user: {
                    id: user?.id,
                    name: user?.name,
                    surname: user?.surname,
                    profilePicture: user?.profilePicture || user?.avatar
                }
            };
        });
    }

    async announceDailyWinners() {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Find everyone who answered today
        const answers = await this.dailyAnswerRepo.find({
            where: {
                createdAt: MoreThanOrEqual(startOfToday)
            }
        });

        // Get unique users who participated but aren't winners (or everyone?)
        const participantIds = [...new Set(answers.map(a => a.userId))];

        const notifications = participantIds.map(userId => {
            return this.notificationsService.createNotification(
                userId,
                'Günün Kazananları Açıklandı! 📢',
                'Günün sorusuna yanıt verenler arasından en iyiler seçildi. Sonuçları görmek için hemen uygulamaya göz at!',
                'daily_results'
            );
        });

        await Promise.allSettled(notifications);
        return { success: true, notifiedCount: participantIds.length };
    }
}
