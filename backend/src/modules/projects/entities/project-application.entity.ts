import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from './project.entity';

@Entity('project_applications')
export class ProjectApplication {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'project_id', type: 'int' })
    projectId: number;

    @Column({ name: 'user_id', type: 'int' })
    userId: number;

    @Column({ type: 'text', nullable: true })
    motivation: string;

    @Column({ name: 'name_surname', type: 'varchar', length: 100, nullable: true })
    nameSurname: string;

    @Column({ name: 'linkedin_url', type: 'varchar', length: 500, nullable: true })
    linkedinUrl: string;

    @Column({ name: 'github_url', type: 'varchar', length: 500, nullable: true })
    githubUrl: string;

    @Column({ name: 'portfolio_url', type: 'varchar', length: 500, nullable: true })
    portfolioUrl: string;

    @Column({ type: 'varchar', length: 50, default: 'pending' })
    status: string; // 'pending', 'accepted', 'rejected'

    @ManyToOne(() => Project, project => project.applications, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn()
    createdAt: Date;
}
