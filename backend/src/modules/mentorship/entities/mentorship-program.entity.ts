import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { MentorshipApplication } from './mentorship-application.entity';

@Entity('mentorship_programs')
export class MentorshipProgram {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    imageUrl: string;

    @Column({ type: 'timestamp' })
    applicationStartDate: Date;

    @Column({ type: 'timestamp' })
    applicationEndDate: Date;

    @Column({ type: 'timestamp' })
    programStartDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    programEndDate: Date;

    @Column({ type: 'int', default: 20 })
    maxParticipants: number;

    @Column({ type: 'varchar', length: 50, default: 'upcoming' })
    status: string; // 'upcoming' | 'accepting' | 'in_review' | 'active' | 'completed'

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => MentorshipApplication, (app) => app.program)
    applications: MentorshipApplication[];
}
