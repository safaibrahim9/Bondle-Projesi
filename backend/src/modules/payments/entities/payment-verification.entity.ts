import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { EventRegistration } from '../../events/entities/event-registration.entity';
import { PaymentStatus } from '../../../common/enums';

@Entity('payment_verifications')
export class PaymentVerification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    userId: number;

    @Column({ type: 'int', nullable: true })
    eventRegistrationId: number;

    @Column({ type: 'boolean', default: false })
    premiumUpgrade: boolean;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'varchar', length: 500 })
    paymentProofUrl: string;

    @Column({
        type: 'varchar',
        length: 50,
        default: PaymentStatus.PENDING,
    })
    status: PaymentStatus;

    @Column({ type: 'int', nullable: true })
    verifiedBy: number;

    @Column({ type: 'timestamp', nullable: true })
    verifiedAt: Date;

    @Column({ type: 'text', nullable: true })
    rejectionReason: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => EventRegistration)
    @JoinColumn({ name: 'eventRegistrationId' })
    eventRegistration: EventRegistration;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'verifiedBy' })
    verifier: User;
}
