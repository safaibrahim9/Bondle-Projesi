import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ClubMemberScore } from './club-member-score.entity';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';

@Entity('club_member_score_logs')
export class ClubMemberScoreLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'score_id', type: 'int' })
    scoreId: number;

    @Column({ name: 'event_id', type: 'int', nullable: true })
    eventId: number;

    @Column({ name: 'points_change', type: 'int' })
    pointsChange: number;

    @Column({ type: 'varchar', length: 255 })
    reason: string; // e.g., 'Event check-in', 'Manual adjustment'

    @Column({ name: 'created_by', type: 'int', nullable: true })
    createdBy: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => ClubMemberScore, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'score_id' })
    score: ClubMemberScore;

    @ManyToOne(() => Event, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'event_id' })
    event: Event;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    creator: User;
}
