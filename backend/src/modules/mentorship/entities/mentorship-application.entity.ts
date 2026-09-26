import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { MentorshipProgram } from './mentorship-program.entity';
import { User } from '../../users/entities/user.entity';

@Entity('mentorship_applications')
export class MentorshipApplication {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    programId: number;

    @Column({ type: 'int' })
    userId: number;

    @Column({ type: 'text' })
    motivation: string;

    @Column({ type: 'text', nullable: true })
    experience: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phone: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email: string;

    @Column({ type: 'varchar', length: 50, default: 'pending' })
    status: string; // 'pending' | 'accepted' | 'rejected'

    @Column({ type: 'varchar', length: 100, nullable: true })
    fullName: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    university: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    department: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => MentorshipProgram, (program) => program.applications)
    @JoinColumn({ name: 'programId' })
    program: MentorshipProgram;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;
}
