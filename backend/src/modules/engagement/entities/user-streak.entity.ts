import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('user_streaks')
export class UserStreak {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id', type: 'int', unique: true })
    userId: number;

    @Column({ name: 'current_streak', type: 'int', default: 0 })
    currentStreak: number;

    @Column({ name: 'longest_streak', type: 'int', default: 0 })
    longestStreak: number;

    @Column({ name: 'last_login_date', type: 'date', nullable: true })
    lastLoginDate: string;

    @Column({ name: 'total_days_active', type: 'int', default: 0 })
    totalDaysActive: number;

    @Column({ name: 'user_referral_code_generated', type: 'boolean', default: false })
    userReferralCodeGenerated: boolean;

    @Column({ name: 'last_ai_recommendation', type: 'text', nullable: true })
    lastAiRecommendation: string;

    @Column({ name: 'last_ai_recommendation_date', type: 'timestamp', nullable: true })
    lastAiRecommendationDate: Date;

    @Column({ name: 'last_networking_ai_suggestion', type: 'text', nullable: true })
    lastNetworkingAiSuggestion: string;

    @Column({ name: 'last_networking_ai_suggestion_date', type: 'timestamp', nullable: true })
    lastNetworkingAiSuggestionDate: Date;

    @Column({ name: 'daily_goals', type: 'text', nullable: true }) // JSON string of [{key, label, completed}]
    dailyGoals: string;

    @Column({ name: 'daily_goals_date', type: 'date', nullable: true })
    dailyGoalsDate: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
