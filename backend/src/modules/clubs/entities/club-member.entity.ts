import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Club } from './club.entity';
import { User } from '../../users/entities/user.entity';
import { ClubMemberRole } from '../../../common/enums';

@Entity('club_members')
export class ClubMember {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    clubId: number;

    @Column({ type: 'int' })
    userId: number;

    @Column({
        type: 'varchar',
        length: 50,
        default: ClubMemberRole.MEMBER,
    })
    role: ClubMemberRole;

    @CreateDateColumn()
    joinedAt: Date;

    @Column({ type: 'varchar', length: 50, nullable: true })
    joinSource: string;

    @ManyToOne(() => Club)
    @JoinColumn({ name: 'clubId' })
    club: Club;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
}
