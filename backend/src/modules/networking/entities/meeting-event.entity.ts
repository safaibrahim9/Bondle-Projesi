import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Meeting } from './meeting.entity';
import { User } from '../../users/entities/user.entity';

export enum MeetingEventType {
    JOIN = 'join',
    LEAVE = 'leave'
}

@Entity('meeting_events')
export class MeetingEvent {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    meetingId: number;

    @ManyToOne(() => Meeting, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'meetingId' })
    meeting: Meeting;

    @Column()
    userId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({
        type: 'enum',
        enum: MeetingEventType
    })
    eventType: MeetingEventType;

    @CreateDateColumn()
    timestamp: Date;
}
