import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

export type ChallengeKey =
    | 'register_event'
    | 'send_connection'
    | 'complete_profile'
    | 'join_club'
    | 'apply_mentorship';

@Entity('weekly_challenge_completions')
export class WeeklyChallengeCompletion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    userId: number;

    @Column({ type: 'varchar', length: 50 })
    challengeKey: ChallengeKey;

    /** ISO week string e.g. "2026-W18" */
    @Column({ type: 'varchar', length: 10 })
    weekKey: string;

    @Column({ type: 'int', default: 0 })
    creditsAwarded: number;

    @CreateDateColumn()
    completedAt: Date;
}
