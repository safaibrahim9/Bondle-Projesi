import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityPost } from './entities/community-post.entity';
import { CommunityLike } from './entities/community-like.entity';
import { CommunityComment } from './entities/community-comment.entity';
import { CommunityCommentLike } from './entities/community-comment-like.entity';
import { CloudinaryService } from '../../common/services/cloudinary.service';

@Injectable()
export class CommunityService {
    constructor(
        @InjectRepository(CommunityPost)
        private postRepository: Repository<CommunityPost>,
        @InjectRepository(CommunityLike)
        private likeRepository: Repository<CommunityLike>,
        @InjectRepository(CommunityComment)
        private commentRepository: Repository<CommunityComment>,
        @InjectRepository(CommunityCommentLike)
        private commentLikeRepository: Repository<CommunityCommentLike>,
        private cloudinaryService: CloudinaryService,
    ) {}

    async createPost(userId: number, content: string, file?: any, clubId?: number, eventId?: number, type: string = 'moment') {
        let imageUrl = null;
        if (file) {
            const uploadResult = await this.cloudinaryService.uploadImage(file, 'community_posts');
            imageUrl = uploadResult.url;
        }

        const post = this.postRepository.create({
            userId,
            content,
            imageUrl,
            clubId: clubId ? Number(clubId) : null,
            eventId: eventId ? Number(eventId) : null,
            type
        });

        return this.postRepository.save(post);
    }

    async updatePost(postId: number, userId: number, content: string) {
        const post = await this.postRepository.findOne({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');

        if (post.userId !== userId) {
            throw new ForbiddenException('You can only edit your own posts');
        }

        post.content = content;
        return this.postRepository.save(post);
    }

    async getFeed(userId?: number, limit: number = 20, offset: number = 0) {
        const posts = await this.postRepository.find({
            relations: ['user', 'club', 'event'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset
        });

        // Add like counts and check if current user liked it
        return Promise.all(posts.map(async (post) => {
            const likeCount = await this.likeRepository.count({ where: { postId: post.id } });
            const commentCount = await this.commentRepository.count({ where: { postId: post.id } });
            const hasLiked = userId ? await this.likeRepository.findOne({ where: { postId: post.id, userId } }) : false;

            return {
                ...post,
                likeCount,
                commentCount,
                hasLiked: !!hasLiked
            };
        }));
    }

    async toggleLike(postId: number, userId: number) {
        const existingLike = await this.likeRepository.findOne({ where: { postId, userId } });
        if (existingLike) {
            await this.likeRepository.remove(existingLike);
            return { liked: false };
        } else {
            const like = this.likeRepository.create({ postId, userId });
            await this.likeRepository.save(like);
            return { liked: true };
        }
    }

    async getPostLikes(postId: number) {
        return this.likeRepository.find({
            where: { postId },
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });
    }

    async addComment(postId: number, userId: number, content: string) {
        const comment = this.commentRepository.create({ postId, userId, content });
        return this.commentRepository.save(comment);
    }

    async getPostComments(postId: number, userId?: number) {
        const comments = await this.commentRepository.find({
            where: { postId },
            relations: ['user'],
            order: { createdAt: 'ASC' }
        });

        return Promise.all(comments.map(async (comment) => {
            const likeCount = await this.commentLikeRepository.count({ where: { commentId: comment.id } });
            const hasLiked = userId ? await this.commentLikeRepository.findOne({ where: { commentId: comment.id, userId } }) : false;

            return {
                ...comment,
                likeCount,
                hasLiked: !!hasLiked
            };
        }));
    }

    async toggleCommentLike(commentId: number, userId: number) {
        const existingLike = await this.commentLikeRepository.findOne({ where: { commentId, userId } });
        if (existingLike) {
            await this.commentLikeRepository.remove(existingLike);
            return { liked: false };
        } else {
            const like = this.commentLikeRepository.create({ commentId, userId });
            await this.commentLikeRepository.save(like);
            return { liked: true };
        }
    }

    async deletePost(postId: number, userId: number, userRole: string) {
        const post = await this.postRepository.findOne({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');

        if (post.userId !== userId && userRole !== 'admin') {
            throw new ForbiddenException('You can only delete your own posts');
        }

        return this.postRepository.remove(post);
    }
}
