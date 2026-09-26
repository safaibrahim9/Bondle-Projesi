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
import { Event } from './event.entity';

@Entity('event_messages')
export class EventMessage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    content: string;

    @Column({ name: 'event_id', type: 'int' })
    eventId: number;

    @ManyToOne(() => Event, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event: Event;

    @Column({ name: 'user_id', type: 'int' })
    userId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'is_edited', default: false })
    isEdited: boolean;

    @Column({ name: 'is_deleted', default: false })
    isDeleted: boolean;

    @Column({ name: 'reply_to_id', type: 'int', nullable: true })
    replyToId: number | null;

    @ManyToOne(() => EventMessage, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'reply_to_id' })
    replyTo: EventMessage;

    @Column({ name: 'is_poll', default: false })
    isPoll: boolean;

    // JSONB array: { id: number, text: string }[]
    @Column({ name: 'poll_options', type: 'jsonb', nullable: true })
    pollOptions: any;

    // JSONB object mapping user_id -> array of option_ids
    // e.g. { "user_1": [1, 2], "user_2": [1] }
    @Column({ name: 'poll_votes', type: 'jsonb', nullable: true })
    pollVotes: any;
}
