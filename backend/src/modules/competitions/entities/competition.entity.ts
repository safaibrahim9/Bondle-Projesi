import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('competitions')
export class Competition {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'varchar', length: 100 })
    category: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    prize: string;

    @Column({ type: 'timestamp' })
    deadline: Date;

    @Column({ type: 'timestamp', nullable: true })
    startDate: Date;

    @Column({ type: 'varchar', length: 500, nullable: true })
    imageUrl: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    externalLink: string;

    @Column({ type: 'int', default: 0 })
    participantCount: number;

    @Column({ type: 'boolean', default: false })
    isOnline: boolean;

    @Column({ type: 'varchar', length: 50, default: 'active' })
    status: string; // 'active', 'ended', 'cancelled'

    @CreateDateColumn()
    createdAt: Date;
}
