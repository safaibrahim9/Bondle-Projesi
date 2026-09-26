import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Event } from './event.entity';
import { User } from '../../users/entities/user.entity';

@Entity('event_feedbacks')
export class EventFeedback {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    eventId: number;

    @Column({ type: 'int' })
    userId: number;

    @Column({ type: 'varchar', length: 255 })
    userName: string;

    @Column({ type: 'text' })
    feedback: string;

    @Column({ type: 'int', nullable: true })
    rating: number; // 1-5 stars

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Event, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'eventId' })
    event: Event;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;
}
