import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('mentorship_relationships')
export class MentorshipRelationship {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    mentorId: number;

    @Column({ type: 'int' })
    menteeId: number;

    @Column({ type: 'varchar', length: 50 })
    status: string; // 'pending', 'active', 'completed', 'rejected'

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'mentorId' })
    mentor: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'menteeId' })
    mentee: User;
}
