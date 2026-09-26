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
import { EventType, PaymentType, EventStatus } from '../../../common/enums';

@Entity('events')
export class Event {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({
        name: 'event_type',
        type: 'varchar',
        length: 50,
    })
    eventType: EventType;

    @Column({
        name: 'payment_type',
        type: 'varchar',
        length: 50,
    })
    paymentType: PaymentType;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    price: number;

    @Column({ name: 'premium_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
    premiumPrice: number;

    @Column({ type: 'timestamp' })
    date: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    location: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    city: string;

    @Column({ name: 'is_online', type: 'boolean', default: false })
    isOnline: boolean;

    @Column({ name: 'zoom_link', type: 'varchar', length: 500, nullable: true })
    zoomLink: string;

    @Column({ name: 'poster_image', type: 'text', nullable: true })
    posterImage: string;

    @Column({ name: 'shopier_url', type: 'varchar', length: 500, nullable: true })
    shopierUrl: string;

    @Column({ name: 'premium_shopier_url', type: 'varchar', length: 500, nullable: true })
    premiumShopierUrl: string;

    @Column({ name: 'participant_limit', type: 'int' })
    participantLimit: number;

    @Column({ name: 'current_participants', type: 'int', default: 0 })
    currentParticipants: number;

    @Column({
        type: 'varchar',
        length: 50,
        default: EventStatus.PENDING,
    })
    status: EventStatus;

    @Column({ name: 'created_by', type: 'int' })
    createdBy: number;

    @Column({ name: 'club_id', type: 'int', nullable: true })
    clubId: number;

    @Column({ name: 'is_global', type: 'boolean', default: false })
    isGlobal: boolean;

    @Column({ name: 'approved_by', type: 'int', nullable: true })
    approvedBy: number;

    @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
    approvedAt: Date;

    @Column({ name: 'requires_feedback', type: 'boolean', default: true })
    requiresFeedback: boolean;

    @Column({ name: 'requires_form', type: 'boolean', default: false })
    requiresForm: boolean;

    @Column({ name: 'circle_format', type: 'text', nullable: true })
    circleFormat: string;

    @Column({ name: 'is_2h_reminder_sent', type: 'boolean', default: false })
    is2hReminderSent: boolean;

    @Column({ name: 'is_24h_reminder_sent', type: 'boolean', default: false })
    is24hReminderSent: boolean;

    @Column({ name: 'is_free_for_ambassadors', type: 'boolean', default: false })
    isFreeForAmbassadors: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    creator: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'approved_by' })
    approver: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'assigned_representative_id' })
    assignedRepresentative: User;

    @Column({ name: 'assigned_representative_id', type: 'int', nullable: true })
    assignedRepresentativeId: number;

    @ManyToOne('Club')
    @JoinColumn({ name: 'club_id' })
    club: any;
}
