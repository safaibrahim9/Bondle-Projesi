import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ReportReason {
    SPAM = 'spam',
    INAPPROPRIATE_CONTENT = 'inappropriate_content',
    HARASSMENT = 'harassment',
    FAKE_PROFILE = 'fake_profile',
    OTHER = 'other'
}

@Entity('reports')
export class Report {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    reporterId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reporterId' })
    reporter: User;

    @Column()
    reportedUserId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reportedUserId' })
    reportedUser: User;

    @Column({
        type: 'enum',
        enum: ReportReason,
        default: ReportReason.OTHER
    })
    reason: ReportReason;

    @Column({ type: 'text', nullable: true })
    details: string;

    @Column({ default: false })
    isResolved: boolean;

    @Column({ type: 'text', nullable: true })
    adminNote: string;

    @CreateDateColumn()
    createdAt: Date;
}
