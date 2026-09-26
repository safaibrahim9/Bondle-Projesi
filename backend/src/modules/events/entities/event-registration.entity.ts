import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Event } from './event.entity';
import { User } from '../../users/entities/user.entity';
import { PaymentStatus } from '../../../common/enums';

@Entity('event_registrations')
@Index(['eventId', 'userId'], { unique: true })
export class EventRegistration {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'event_id', type: 'int' })
    eventId: number;

    @Column({ name: 'user_id', type: 'int' })
    userId: number;

    @Column({ type: 'varchar', length: 150, nullable: true })
    email: string;

    @Column({
        type: 'varchar',
        length: 50,
        default: 'PENDING', // PENDING, APPROVED, REJECTED
    })
    status: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    paymentProofUrl: string;

    @Column({
        name: 'payment_status',
        type: 'varchar',
        length: 50,
        default: PaymentStatus.PENDING,
    })
    paymentStatus: PaymentStatus;

    @CreateDateColumn({ name: 'registered_at' })
    registeredAt: Date;

    @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
    verifiedAt: Date;

    @Column({ name: 'is_checked_in', type: 'boolean', default: false })
    isCheckedIn: boolean;

    @Column({ name: 'checked_in_at', type: 'timestamp', nullable: true })
    checkedInAt: Date;

    @Column({ name: 'verified_by', type: 'int', nullable: true })
    verifiedBy: number;

    @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
    firstName: string;

    @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
    lastName: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phone: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    university: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    department: string;

    @Column({ name: 'class_level', type: 'varchar', length: 50, nullable: true })
    classLevel: string;

    @Column({ type: 'text', nullable: true })
    motivation: string;

    @Column({ type: 'text', nullable: true })
    expectations: string;

    @ManyToOne(() => Event, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event: Event;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'verified_by' })
    verifier: User;
}
