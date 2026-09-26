import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('credits')
export class Credit {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', unique: true })
    userId: number;

    @Column({ type: 'int', default: 0 })
    totalCredits: number;

    @Column({ type: 'int', default: 0 })
    usedCredits: number;

    @Column({ type: 'int', default: 0 })
    availableCredits: number;

    @Column({ type: 'timestamp', nullable: true })
    lastResetDate: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
}
