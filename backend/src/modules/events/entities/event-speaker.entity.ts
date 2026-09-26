import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Event } from './event.entity';

@Entity('event_speakers')
export class EventSpeaker {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    eventId: number;

    @Column({ type: 'varchar', length: 255 })
    speakerName: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Event, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'eventId' })
    event: Event;
}
