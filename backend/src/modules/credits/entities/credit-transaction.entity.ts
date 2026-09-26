import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TransactionType } from '../../../common/enums';

@Entity('credit_transactions')
export class CreditTransaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    userId: number;

    @Column({ type: 'int' })
    creditsUsed: number;

    @Column({
        type: 'varchar',
        length: 50,
    })
    transactionType: TransactionType;

    @Column({ type: 'int', nullable: true })
    referenceId: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    referenceType: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
}
