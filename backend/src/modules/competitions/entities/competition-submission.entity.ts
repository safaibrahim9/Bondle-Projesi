import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Competition } from './competition.entity';

@Entity('competition_submissions')
export class CompetitionSubmission {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    competitionId: number;

    @Column({ type: 'int' })
    userId: number;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 255 })
    surname: string;

    @Column({ type: 'text' })
    motivation: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    university: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    department: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    phone: string;

    @Column({ type: 'varchar', length: 50, default: 'pending' })
    status: string; // 'pending', 'approved', 'rejected'

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Competition)
    @JoinColumn({ name: 'competitionId' })
    competition: Competition;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;
}
