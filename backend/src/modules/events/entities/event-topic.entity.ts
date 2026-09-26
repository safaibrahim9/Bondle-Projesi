import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Event } from './event.entity';

@Entity('event_topics')
export class EventTopic {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    eventId: number;

    @Column({ type: 'varchar', length: 100 })
    topic: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Event, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'eventId' })
    event: Event;
}
