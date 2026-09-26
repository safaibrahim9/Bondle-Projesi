import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    ManyToMany,
    JoinTable
} from 'typeorm';
import { Connection } from './connection.entity';
import { User } from '../../users/entities/user.entity';
import { MeetingStatus } from '../../../common/enums';

@Entity('meetings')
export class Meeting {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', nullable: true })
    connectionId: number;

    @Column({ type: 'int', nullable: true })
    creatorId: number;

    @Column({ type: 'timestamp' })
    scheduledDate: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    title: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    location: string;

    @Column({ type: 'boolean', default: false })
    isOnline: boolean;

    @Column({ type: 'varchar', length: 500, nullable: true })
    zoomLink: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    jitsiRoomId: string;

    @Column({
        type: 'varchar',
        length: 50,
        default: MeetingStatus.SCHEDULED,
    })
    status: MeetingStatus;

    @Column({
        type: 'varchar',
        length: 50,
        default: 'networking'
    })
    meetingType: string;

    @Column({ type: 'int', default: 25 })
    durationLimit: number;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Connection)
    @JoinColumn({ name: 'connectionId' })
    connection: Connection;

    @ManyToMany(() => User)
    @JoinTable({
        name: 'meeting_participants',
        joinColumn: { name: 'meetingId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' }
    })
    participants: User[];
}
