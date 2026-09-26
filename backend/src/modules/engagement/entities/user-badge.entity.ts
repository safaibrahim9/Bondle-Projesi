import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type BadgeType =
    | 'first_login'
    | 'streak_3'
    | 'streak_7'
    | 'streak_30'
    | 'networker'
    | 'super_networker'
    | 'event_goer'
    | 'event_enthusiast'
    | 'mentee'
    | 'competitor'
    | 'club_member'
    | 'profile_complete'
    | 'premium';

@Entity('user_badges')
export class UserBadge {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    userId: number;

    @Column({ type: 'varchar', length: 50 })
    badge: BadgeType;

    @Column({ type: 'boolean', default: true })
    earned: boolean;

    @CreateDateColumn()
    earnedAt: Date;

    @ManyToOne(() => User, (user) => user.badges, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
}
