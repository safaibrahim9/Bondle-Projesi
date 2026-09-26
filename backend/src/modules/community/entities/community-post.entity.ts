import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Club } from '../../clubs/entities/club.entity';
import { Event } from '../../events/entities/event.entity';

@Entity('community_posts')
export class CommunityPost {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    userId: number;

    @Column({ type: 'int', nullable: true })
    clubId: number;

    @Column({ type: 'int', nullable: true })
    eventId: number;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    imageUrl: string;

    @Column({ type: 'varchar', length: 50, default: 'moment' }) // 'moment', 'post', 'announcement'
    type: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Club, { nullable: true })
    @JoinColumn({ name: 'clubId' })
    club: Club;

    @ManyToOne(() => Event, { nullable: true })
    @JoinColumn({ name: 'eventId' })
    event: Event;
}
