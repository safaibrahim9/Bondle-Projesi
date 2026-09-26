import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('announcements')
export class Announcement {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column()
    image: string;

    @Column({ nullable: true })
    linkTo: string;

    @Column({ nullable: true })
    city: string;

    @Column({ default: false })
    isPinned: boolean;

    @Column({ default: 0 })
    priority: number;

    @Column({ default: false })
    isGlobal: boolean;

    @Column({ nullable: true })
    clubId: number;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
