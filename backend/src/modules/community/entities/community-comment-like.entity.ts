import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CommunityComment } from './community-comment.entity';

@Entity('community_comment_likes')
@Unique(['commentId', 'userId'])
export class CommunityCommentLike {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    commentId: number;

    @Column()
    userId: number;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => CommunityComment, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'commentId' })
    comment: CommunityComment;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;
}
