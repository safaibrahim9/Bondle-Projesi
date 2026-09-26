import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('premium_requests')
export class PremiumRequest {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    userId: number;

    @Column({ type: 'varchar', length: 50, default: 'pending' })
    status: string; // 'pending', 'approved', 'rejected'

    @Column({ type: 'text', nullable: true })
    paymentProof: string; // URL to payment screenshot/proof

    @Column({ type: 'varchar', length: 255, nullable: true })
    shopierOrderId: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    processedAt: Date;

    @Column({ type: 'int', nullable: true })
    processedBy: number; // Admin ID who processed this request

    @Column({ type: 'text', nullable: true })
    rejectionReason: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'processedBy' })
    admin: User;
}
