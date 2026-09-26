import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CommunityPost } from './community-post.entity';

@Entity('community_comments')
export class CommunityComment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    postId: number;

    @Column()
    userId: number;

    @Column({ type: 'text' })
    content: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => CommunityPost, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post: CommunityPost;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;
}
