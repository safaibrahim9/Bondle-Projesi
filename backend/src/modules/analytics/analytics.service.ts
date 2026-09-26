import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, DataSource } from 'typeorm';
import { UserActivityLog } from './entities/user-activity-log.entity';
import { UserEventLog } from './entities/user-event-log.entity';
import { User } from '../users/entities/user.entity';
import { AiService } from '../../common/services/ai.service';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(UserActivityLog)
        private activityRepository: Repository<UserActivityLog>,
        @InjectRepository(UserEventLog)
        private eventRepository: Repository<UserEventLog>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private aiService: AiService,
        private dataSource: DataSource,
    ) {}

    async logActivity(userId: number, page: string, duration: number) {
        // Cap duration to 2 hours (7200 seconds) to prevent inflated metrics from inactive tabs
        if (duration > 7200) {
            duration = 7200;
        }
        const log = this.activityRepository.create({
            userId,
            page,
            duration
        });
        return this.activityRepository.save(log);
    }

    async logEvent(userId: number, eventType: string, eventName: string, metadata?: any) {
        const event = this.eventRepository.create({
            userId,
            eventType,
            eventName,
            metadata
        });
        return this.eventRepository.save(event);
    }

    async getOverallStats(period: string = 'all') {
        try {
            const query = this.activityRepository.createQueryBuilder('log');
            const eventQuery = this.eventRepository.createQueryBuilder('event');
            const startDate = this.getStartDate(period);
            
            if (startDate) {
                query.where('log.createdAt >= :startDate', { startDate });
                eventQuery.where('event.createdAt >= :startDate', { startDate });
            }

            // Most visited pages
            const pageStats = await query
                .clone()
                .select('log.page', 'page')
                .addSelect('SUM(log.duration)', 'totalDuration')
                .addSelect('COUNT(log.id)', 'visitCount')
                .groupBy('log.page')
                .orderBy('SUM(log.duration)', 'DESC')
                .getRawMany();

            // Total time spent in app
            const totalDurationResult = await query
                .clone()
                .select('SUM(log.duration)', 'total')
                .getRawOne();

            // User specific totals
            const userStats = await query
                .clone()
                .leftJoin('log.user', 'user')
                .select('user.id', 'userId')
                .addSelect('user.name', 'userName')
                .addSelect('user.surname', 'userSurname')
                .addSelect('SUM(log.duration)', 'totalDuration')
                .addSelect('COUNT(DISTINCT log.page)', 'uniquePages')
                .groupBy('user.id')
                .addGroupBy('user.name')
                .addGroupBy('user.surname')
                .orderBy('SUM(log.duration)', 'DESC')
                .limit(50)
                .getRawMany();

            // Event stats (clicks, buttons etc)
            const eventStats = await eventQuery
                .clone()
                .select('event.eventName', 'name')
                .addSelect('COUNT(*)', 'count')
                .where('event.eventType = :type', { type: 'click' })
                .groupBy('event.eventName')
                .orderBy('count', 'DESC')
                .limit(20)
                .getRawMany();

            // Search stats
            const isPostgres = this.dataSource.options.type === 'postgres';
            const queryJsonPath = isPostgres 
                ? "event.metadata->>'query'" 
                : "json_extract(event.metadata, '$.query')";

            const searchStats = await eventQuery
                .clone()
                .select(queryJsonPath, 'query')
                .addSelect('COUNT(*)', 'count')
                .andWhere('event.eventType = :type', { type: 'search' })
                .andWhere(`${queryJsonPath} IS NOT NULL`)
                .groupBy(queryJsonPath)
                .orderBy('count', 'DESC')
                .limit(20)
                .getRawMany().catch(err => {
                    console.error('[Analytics] Search Stats Error:', err.message);
                    return [];
                });

            // Simple Retention (Users who returned in the period)
            const retention = await this.calculateRetention(startDate);

            // Funnels (Fixed funnels for now)
            const funnels = await this.getFunnelStats(period).catch(err => {
                console.error('[Analytics] Funnel Stats Error:', err.message);
                return [];
            });

            // DAU / MAU / Stickiness
            const dauMau = await this.calculateDauMau();

            // Churn Rate
            const churnRate = await this.calculateChurnRate();

            // Cohort Retention
            const cohortRetention = await this.calculateCohortRetention();

            // Daily Usage
            const dateFormat = isPostgres 
                ? "TO_CHAR(log.createdAt, 'YYYY-MM-DD')" 
                : "strftime('%Y-%m-%d', log.createdAt)";
                
            const dailyUsage = await query
                .clone()
                .select(dateFormat, 'date')
                .addSelect('SUM(log.duration)', 'totalDuration')
                .addSelect('COUNT(DISTINCT log.userId)', 'activeUsers')
                .groupBy(dateFormat)
                .orderBy('date', 'ASC')
                .getRawMany().catch(e => { console.error('Daily Usage Error:', e); return []; });

            const response = {
                pageStats: pageStats || [],
                totalDuration: parseInt(totalDurationResult?.total || '0') || 0,
                userStats: userStats || [],
                eventStats: eventStats || [],
                searchStats: searchStats || [],
                retention: retention || { activeUsers: 0, rate: '0%' },
                funnels: funnels || [],
                dauMau: dauMau || { dau: 0, mau: 0, ratio: 0 },
                churnRate: churnRate || 0,
                cohortRetention: cohortRetention || [],
                dailyUsage: dailyUsage || []
            };

            return response;
        } catch (error) {
            console.error('[Analytics] Overall Stats Error:', error);
            throw error;
        }
    }

    private async calculateRetention(startDate: Date | null) {
        try {
            // Simple retention: % of users active in this period who were also active before
            const totalUsersInPeriod = await this.activityRepository
                .createQueryBuilder('log')
                .select('COUNT(DISTINCT log.userId)', 'count')
                .where(startDate ? 'log.createdAt >= :startDate' : '1=1', { startDate })
                .getRawOne();

            return {
                activeUsers: parseInt(totalUsersInPeriod?.count || '0'),
                rate: 'N/A'
            };
        } catch (error) {
            console.error('Error in calculateRetention:', error);
            return { activeUsers: 0, rate: 'Error' };
        }
    }

    private async getFunnelStats(period: string) {
        const startDate = this.getStartDate(period);
        
        // Helper to count unique users and get their info for a specific condition
        const getStepData = async (repo: Repository<any>, condition: string, params: any = {}) => {
            const isPostgres = this.dataSource.options.type === 'postgres';
            const jsonAggFunc = isPostgres 
                ? "JSON_AGG(DISTINCT JSON_BUILD_OBJECT('userId', user.id, 'userName', user.name, 'userSurname', user.surname))"
                : "JSON_GROUP_ARRAY(JSON_OBJECT('userId', user.id, 'userName', user.name, 'userSurname', user.surname))";

            const qb = repo.createQueryBuilder('t')
                .leftJoin('t.user', 'user')
                .select('COUNT(DISTINCT t.userId)', 'count')
                .addSelect(jsonAggFunc, 'users');
            
            if (startDate) {
                qb.where('t.createdAt >= :startDate', { startDate });
                qb.andWhere(condition, params);
            } else {
                qb.where(condition, params);
            }
            
            const res = await qb.getRawOne();
            
            // Handle Postgres JSON_AGG potential null and parsing
            let users = [];
            try {
                users = typeof res.users === 'string' ? JSON.parse(res.users) : (res.users || []);
            } catch (e) {
                users = res.users || [];
            }

            return {
                count: parseInt(res?.count || '0'),
                users: users.filter(u => u && u.userId) // Filter out nulls
            };
        };

        const steps = [
            { 
                label: 'Etkinlik Listesi', 
                ...(await getStepData(this.activityRepository, 't.page = :p', { p: '/events' }))
            },
            { 
                label: 'Etkinlik Detayı', 
                ...(await getStepData(this.activityRepository, "t.page LIKE '/events/%'"))
            },
            { 
                label: 'Kayıt Butonu', 
                ...(await getStepData(this.eventRepository, "t.eventName = 'event_register_click'"))
            },
            { 
                label: 'Başarılı Kayıt', 
                ...(await getStepData(this.eventRepository, "t.eventName = 'event_register_success'"))
            },
        ];

        return steps;
    }

    private async calculateDauMau() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            thirtyDaysAgo.setHours(0, 0, 0, 0);

            const logs = await this.activityRepository.createQueryBuilder('log')
                .leftJoin('log.user', 'user')
                .select([
                    'log.userId', 
                    'log.createdAt', 
                    'user.id', 
                    'user.name', 
                    'user.surname', 
                    'user.profilePicture'
                ])
                .where('log.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
                .getMany();

            const userMap = new Map();
            let dauCount = 0;

            for (const log of logs) {
                if (!log.user) continue;

                if (!userMap.has(log.userId)) {
                    userMap.set(log.userId, {
                        user: {
                            id: log.user.id,
                            name: log.user.name,
                            surname: log.user.surname,
                            profilePicture: log.user.profilePicture
                        },
                        activeDates: new Set<string>()
                    });
                }

                // YYYY-MM-DD
                const dateStr = log.createdAt.toISOString().split('T')[0];
                userMap.get(log.userId).activeDates.add(dateStr);

                // Is active today?
                if (log.createdAt >= today) {
                    userMap.get(log.userId).isDau = true;
                }
            }

            const mauUsers = [];
            for (const [userId, data] of userMap.entries()) {
                if (data.isDau) dauCount++;
                
                const activeDays = data.activeDates.size;
                const inactiveDays = 30 - activeDays;
                const stickinessRate = Math.round((activeDays / 30) * 100);

                mauUsers.push({
                    ...data.user,
                    activeDays,
                    inactiveDays,
                    stickinessRate,
                    isDau: !!data.isDau
                });
            }

            mauUsers.sort((a, b) => b.stickinessRate - a.stickinessRate);

            const mau = mauUsers.length;
            const ratio = mau > 0 ? (dauCount / mau) * 100 : 0;

            return { dau: dauCount, mau, ratio: Math.round(ratio), users: mauUsers };
        } catch (e) {
            console.error('DAU/MAU Error:', e);
            return { dau: 0, mau: 0, ratio: 0, users: [] };
        }
    }

    private async calculateChurnRate() {
        try {
            // Churn: Users created > 30 days ago, who haven't logged any activity in the last 30 days.
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Total users registered before 30 days ago
            const eligibleUsers = await this.userRepository.createQueryBuilder('user')
                .select(['user.id', 'user.name', 'user.surname', 'user.profilePicture'])
                .where('user.createdAt < :thirtyDaysAgo', { thirtyDaysAgo })
                .getMany();

            const totalEligibleCount = eligibleUsers.length;
            if (totalEligibleCount === 0) return { rate: 0, users: [] };

            // Users who WERE active in the last 30 days
            const activeLogs = await this.activityRepository.createQueryBuilder('log')
                .select('DISTINCT log.userId', 'userId')
                .where('log.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
                .getRawMany();

            const activeUserIds = new Set(activeLogs.map(l => l.userId));
            const churnedUsers = eligibleUsers.filter(u => !activeUserIds.has(u.id));
            
            const churnRate = (churnedUsers.length / totalEligibleCount) * 100;

            return { rate: Math.round(churnRate), users: churnedUsers };
        } catch (e) {
            console.error('Churn Rate Error:', e);
            return { rate: 0, users: [] };
        }
    }

    private async calculateCohortRetention() {
        try {
            // Get users registered in the last 6 weeks
            const sixWeeksAgo = new Date();
            sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
            sixWeeksAgo.setHours(0, 0, 0, 0);

            const users = await this.userRepository.createQueryBuilder('user')
                .select(['user.id', 'user.name', 'user.surname', 'user.profilePicture', 'user.createdAt'])
                .where('user.createdAt >= :sixWeeksAgo', { sixWeeksAgo })
                .getMany();

            if (users.length === 0) return [];

            const userIds = users.map(u => u.id);
            const userMap = new Map(users.map(u => [u.id, u]));

            // Fetch their activity logs
            const activities = await this.activityRepository.createQueryBuilder('log')
                .select(['log.userId', 'log.createdAt'])
                .where('log.userId IN (:...userIds)', { userIds })
                .getMany();

            // Process cohorts in memory
            const getWeekKey = (date: Date) => {
                const startOfYear = new Date(date.getFullYear(), 0, 1);
                const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
                const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
                return `${date.getFullYear()}-W${weekNumber}`;
            };

            const cohortMap = new Map<string, { total: number, registeredUsers: any[], activeByWeek: { [weekOffset: number]: Set<number> } }>();

            // Assign users to cohorts
            for (const user of users) {
                const cohortKey = getWeekKey(user.createdAt);
                if (!cohortMap.has(cohortKey)) {
                    cohortMap.set(cohortKey, { total: 0, registeredUsers: [], activeByWeek: {} });
                }
                cohortMap.get(cohortKey).total += 1;
                cohortMap.get(cohortKey).registeredUsers.push(user);
            }

            // Assign activities to weeks after registration
            for (const log of activities) {
                const user = userMap.get(log.userId);
                if (!user) continue;

                const cohortKey = getWeekKey(user.createdAt);
                const diffTime = log.createdAt.getTime() - user.createdAt.getTime();
                const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));

                if (diffWeeks >= 0 && diffWeeks <= 5) {
                    const cohortData = cohortMap.get(cohortKey);
                    if (!cohortData.activeByWeek[diffWeeks]) {
                        cohortData.activeByWeek[diffWeeks] = new Set();
                    }
                    cohortData.activeByWeek[diffWeeks].add(log.userId);
                }
            }

            // Format for response
            const sortedCohorts = Array.from(cohortMap.entries())
                .sort((a, b) => a[0].localeCompare(b[0]));

            return sortedCohorts.map(([cohort, data]) => {
                const retentionRates = [];
                for (let i = 0; i <= 5; i++) {
                    const activeUserIds = data.activeByWeek[i] ? Array.from(data.activeByWeek[i]) : [];
                    const activeUsers = activeUserIds.map(id => userMap.get(id)).filter(u => u);
                    
                    // Always include week 0 logic implicitly: week 0 usually should have 100% or very high, 
                    // but we just return real data
                    
                    retentionRates.push({
                        rate: Math.round((activeUsers.length / data.total) * 100),
                        users: activeUsers
                    });
                }
                return { cohort, totalUsers: data.total, registeredUsers: data.registeredUsers, retentionRates };
            });

        } catch (e) {
            console.error('Cohort Retention Error:', e);
            return [];
        }
    }

    async getAIInsights(period: string) {
        const stats = await this.getOverallStats(period);
        
        const prompt = `
        Sen bir profesyonel veri analistisin. Aşağıdaki UniVerse platformu kullanım verilerini analiz et ve 3-4 maddelik KISA, aksiyon odaklı ve profesyonel öneriler sun.
        Veriler (${period}):
        - En popüler sayfalar: ${JSON.stringify(stats.pageStats.slice(0, 5))}
        - En çok yapılan aramalar: ${JSON.stringify(stats.searchStats.slice(0, 5))}
        - Tıklanan butonlar: ${JSON.stringify(stats.eventStats.slice(0, 5))}
        - Toplam kullanım süresi: ${stats.totalDuration} saniye.
        
        Yanıtı sadece Türkçe ve markdown formatında (bullet points) ver. "Analiz:" başlığıyla başla.
        `;

        try {
            const insights = await this.aiService.generateResponse(prompt);
            return { insights };
        } catch (error) {
            return { insights: "Analiz şu an oluşturulamadı. Lütfen AI servis anahtarlarını kontrol edin." };
        }
    }

    async getPageUsers(page: string, period: string = 'all') {
        const query = this.activityRepository.createQueryBuilder('log')
            .leftJoin('log.user', 'user')
            .select('user.id', 'userId')
            .addSelect('user.name', 'userName')
            .addSelect('user.surname', 'userSurname')
            .addSelect('SUM(log.duration)', 'duration')
            .addSelect('COUNT(log.id)', 'visitCount')
            .where('log.page = :page', { page });

        const startDate = this.getStartDate(period);
        if (startDate) {
            query.andWhere('log.createdAt >= :startDate', { startDate });
        }

        return query
            .groupBy('user.id')
            .addGroupBy('user.name')
            .addGroupBy('user.surname')
            .orderBy('SUM(log.duration)', 'DESC')
            .getRawMany();
    }

    async getDailyUsers(dateStr: string) {
        // dateStr is 'YYYY-MM-DD'
        const isPostgres = this.dataSource.options.type === 'postgres';
        const dateFormat = isPostgres 
            ? "TO_CHAR(log.createdAt, 'YYYY-MM-DD')" 
            : "strftime('%Y-%m-%d', log.createdAt)";

        return this.activityRepository.createQueryBuilder('log')
            .leftJoin('log.user', 'user')
            .select('user.id', 'userId')
            .addSelect('user.name', 'userName')
            .addSelect('user.surname', 'userSurname')
            .addSelect('SUM(log.duration)', 'totalDuration')
            .addSelect('COUNT(DISTINCT log.page)', 'uniquePages')
            .where(`${dateFormat} = :date`, { date: dateStr })
            .groupBy('user.id')
            .addGroupBy('user.name')
            .addGroupBy('user.surname')
            .orderBy('SUM(log.duration)', 'DESC')
            .getRawMany();
    }

    private getStartDate(period: string): Date | null {
        // Server runs in UTC. Turkish time = UTC+3.
        // So "today in Turkey" starts at UTC 21:00 of the previous day.
        const TZ_OFFSET_HOURS = 3; // UTC+3 for Turkey
        const now = new Date();
        
        if (period === 'daily') {
            // Find start of today in Turkey (UTC+3) = UTC midnight - 3 hours
            const turkeyNow = new Date(now.getTime() + TZ_OFFSET_HOURS * 60 * 60 * 1000);
            const startOfTurkeyDay = new Date(turkeyNow);
            startOfTurkeyDay.setUTCHours(0, 0, 0, 0);
            // Convert back to UTC
            const startUTC = new Date(startOfTurkeyDay.getTime() - TZ_OFFSET_HOURS * 60 * 60 * 1000);
            console.log(`[Analytics] Daily: now=${now.toISOString()}, turkeyNow=${turkeyNow.toISOString()}, startUTC=${startUTC.toISOString()}`);
            return startUTC;
        } else if (period === 'weekly') {
            const date = new Date();
            date.setDate(date.getDate() - 7);
            date.setUTCHours(0, 0, 0, 0);
            return date;
        } else if (period === 'monthly') {
            const date = new Date();
            date.setUTCDate(1);
            date.setUTCHours(0, 0, 0, 0);
            return date;
        }
        return null;
    }

    async getUserActivitySummary(userId: number, period: string = 'all') {
        const query = this.activityRepository.createQueryBuilder('log')
            .select('log.page', 'page')
            .addSelect('SUM(log.duration)', 'duration')
            .where('log.userId = :userId', { userId });

        const startDate = this.getStartDate(period);
        if (startDate) {
            query.andWhere('log.createdAt >= :startDate', { startDate });
        }

        const userStats = await query
            .clone()
            .groupBy('log.page')
            .orderBy('SUM(log.duration)', 'DESC')
            .getRawMany();

        const totalDurationResult = await query
            .clone()
            .select('SUM(log.duration)', 'total')
            .getRawOne();

        return {
            pages: userStats,
            totalDuration: parseInt(totalDurationResult.total || '0')
        };
    }
}
