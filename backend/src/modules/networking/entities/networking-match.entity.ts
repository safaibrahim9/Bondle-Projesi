import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MatchType, MatchStatus } from '../../../common/enums';

@Entity('networking_matches')
export class NetworkingMatch {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    user1Id: number;

    @Column({ type: 'int' })
    user2Id: number;

    @Column({
        type: 'varchar',
        length: 50,
    })
    matchType: MatchType;

    @Column({ type: 'int', default: 1 })
    matchCount: number;

    @Column({
        type: 'varchar',
        length: 50,
        default: MatchStatus.PENDING,
    })
    status: MatchStatus;

    @Column({ type: 'boolean', default: true })
    canRematch: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user1Id' })
    user1: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user2Id' })
    user2: User;
}
