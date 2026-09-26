import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { Event } from '../events/entities/event.entity';
import { FeedbackType } from '../../common/enums';

@Injectable()
export class FeedbackService {
    constructor(
        @InjectRepository(Feedback)
        private feedbackRepository: Repository<Feedback>,
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
    ) { }

    async createEventFeedback(
        userId: number,
        eventId: number,
        rating: number,
        comment?: string,
    ) {
        // Check if event exists
        const event = await this.eventRepository.findOne({
            where: { id: eventId },
        });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        // Check if event has ended
        if (new Date() < event.date) {
            throw new BadRequestException(
                'Cannot submit feedback before event ends',
            );
        }

        // Check if user already submitted feedback for this event
        const existingFeedback = await this.feedbackRepository.findOne({
            where: { userId, eventId },
        });

        if (existingFeedback) {
            throw new BadRequestException(
                'You have already submitted feedback for this event',
            );
        }

        // Validate rating (1-5)
        if (rating < 1 || rating > 5) {
            throw new BadRequestException('Rating must be between 1 and 5');
        }

        // Create feedback
        const feedback = this.feedbackRepository.create({
            userId,
            eventId,
            rating,
            comment,
            feedbackType: FeedbackType.EVENT,
        });

        return this.feedbackRepository.save(feedback);
    }

    async createGeneralFeedback(
        userId: number,
        rating: number,
        comment?: string,
    ) {
        // Validate rating (1-5)
        if (rating < 1 || rating > 5) {
            throw new BadRequestException('Rating must be between 1 and 5');
        }

        const feedback = this.feedbackRepository.create({
            userId,
            rating,
            comment,
            feedbackType: FeedbackType.GENERAL,
        });

        return this.feedbackRepository.save(feedback);
    }

    async getEventFeedback(eventId: number) {
        return this.feedbackRepository.find({
            where: { eventId, feedbackType: FeedbackType.EVENT },
            order: { createdAt: 'DESC' },
        });
    }

    async getMyFeedback(userId: number) {
        return this.feedbackRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async getAverageRating(eventId: number): Promise<number> {
        const feedbacks = await this.feedbackRepository.find({
            where: { eventId, feedbackType: FeedbackType.EVENT },
        });

        if (feedbacks.length === 0) {
            return 0;
        }

        const sum = feedbacks.reduce((acc, fb) => acc + fb.rating, 0);
        return Math.round((sum / feedbacks.length) * 10) / 10; // Round to 1 decimal
    }

    async getAllGeneralFeedback() {
        return this.feedbackRepository.find({
            where: { feedbackType: FeedbackType.GENERAL },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }
}
