import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { User } from './user.entity';

@Entity('profile_views')
export class ProfileView {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    viewerId: number;

    @Column()
    viewedId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'viewerId' })
    viewer: User;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'viewedId' })
    viewed: User;

    @CreateDateColumn()
    createdAt: Date;
}
