import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', nullable: true })
    adminId: number;

    @Column({ type: 'varchar', length: 100 })
    action: string; // e.g., 'ASSIGN_MEETING', 'BAN_USER', 'APPROVE_EVENT'

    @Column({ type: 'text', nullable: true })
    details: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    ipAddress: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'adminId' })
    admin: User;
}
