import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'varchar', length: 100 })
    category: string; // 'web', 'mobile', 'ai', 'data', 'game', 'other'

    @Column({ type: 'simple-array', nullable: true })
    requiredSkills: string[];

    @Column({ name: 'max_members', type: 'int', default: 4 })
    maxMembers: number;

    @Column({ name: 'current_members', type: 'int', default: 1 })
    currentMembers: number;

    @Column({ type: 'varchar', length: 500, nullable: true })
    githubUrl: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    linkedinUrl: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    projectUrl: string;

    @Column({ type: 'varchar', length: 50, default: 'open' })
    status: string; // 'open', 'closed', 'completed'

    @Column({ name: 'creator_id', type: 'int' })
    creatorId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'creator_id' })
    creator: User;

    @OneToMany('ProjectApplication', 'project')
    applications: any[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
