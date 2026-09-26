import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_blocks')
@Unique(['blockerId', 'blockedId'])
export class UserBlock {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    blockerId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'blockerId' })
    blocker: User;

    @Column()
    blockedId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'blockedId' })
    blockedUser: User;

    @CreateDateColumn()
    createdAt: Date;
}
