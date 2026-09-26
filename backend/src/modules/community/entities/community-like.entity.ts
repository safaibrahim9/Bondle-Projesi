import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CommunityPost } from './community-post.entity';

@Entity('community_likes')
@Unique(['postId', 'userId'])
export class CommunityLike {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    postId: number;

    @Column()
    userId: number;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => CommunityPost, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post: CommunityPost;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;
}
