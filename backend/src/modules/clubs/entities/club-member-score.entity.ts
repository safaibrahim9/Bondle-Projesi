import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Club } from './club.entity';

@Entity('club_member_scores')
@Index(['clubId', 'userId'], { unique: true })
export class ClubMemberScore {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'club_id', type: 'int' })
    clubId: number;

    @Column({ name: 'user_id', type: 'int' })
    userId: number;

    @Column({ name: 'total_score', type: 'int', default: 0 })
    totalScore: number;

    @Column({ name: 'events_attended', type: 'int', default: 0 })
    eventsAttended: number;

    @Column({ name: 'participation_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
    participationRate: number; // Percentage like 85.50

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => Club, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'club_id' })
    club: Club;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
