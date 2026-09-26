import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NetworkingMatch } from './networking-match.entity';

@Entity('connections')
@Index(['connectedFromMatchId'], { unique: true })
export class Connection {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    user1Id: number;

    @Column({ type: 'int' })
    user2Id: number;

    @Column({ type: 'int', nullable: true })
    connectedFromMatchId: number;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user1Id' })
    user1: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user2Id' })
    user2: User;

    @ManyToOne(() => NetworkingMatch)
    @JoinColumn({ name: 'connectedFromMatchId' })
    match: NetworkingMatch;
}
