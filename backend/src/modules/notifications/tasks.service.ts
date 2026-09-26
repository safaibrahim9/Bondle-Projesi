import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { Event } from '../events/entities/event.entity';
import { EventRegistration } from '../events/entities/event-registration.entity';
import { User } from '../users/entities/user.entity';
import { EventStatus } from '../../common/enums';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        private notificationsService: NotificationsService,
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        @InjectRepository(EventRegistration)
        private eventRegistrationRepository: Repository<EventRegistration>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    // Run every 15 minutes to check for events starting in exactly 2 hours
    @Cron('*/15 * * * *')
    async handleEventReminders() {
        if (process.env.RUN_CRON !== 'true') return;
        const now = new Date();
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        
        // Window of 15 minutes (to match cron interval)
        const twoHoursAnd15Mins = new Date(twoHoursFromNow.getTime() + 15 * 60 * 1000 - 1);

        const upcomingEvents = await this.eventRepository.find({
            where: {
                status: EventStatus.APPROVED,
                date: Between(twoHoursFromNow, twoHoursAnd15Mins),
                is2hReminderSent: false,
            },
        });

        for (const event of upcomingEvents) {
            // Atomic update to prevent multiple instances from sending at the same time
            const updateResult = await this.eventRepository.update(
                { id: event.id, is2hReminderSent: false },
                { is2hReminderSent: true }
            );
            
            if (updateResult.affected === 0) {
                continue; // Another instance already processed this event
            }
            this.logger.log(`Sending 2-hour reminders for event: ${event.title}`);
            
            const registrations = await this.eventRegistrationRepository.find({
                where: { eventId: event.id, status: 'APPROVED' },
            });

            for (const reg of registrations) {
                await this.notificationsService.createNotification(
                    reg.userId,
                    'Etkinlik Başlıyor! ⏰',
                    `"${event.title}" etkinliğinin başlamasına sadece 2 saat kaldı. Hazırlanmayı unutma!`,
                    'EVENT_REMINDER',
                    event.id
                );
            }
        }
    }

    // Run every 15 minutes to check for events starting in 24 hours
    @Cron('*/15 * * * *')
    async handleTomorrowEventReminders() {
        const now = new Date();
        const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const next24h15m = new Date(next24h.getTime() + 15 * 60 * 1000 - 1);

        const upcomingEvents = await this.eventRepository.find({
            where: {
                status: EventStatus.APPROVED,
                date: Between(next24h, next24h15m),
                is24hReminderSent: false,
            },
        });

        for (const event of upcomingEvents) {
            // Atomic update to prevent multiple instances from sending at the same time
            const updateResult = await this.eventRepository.update(
                { id: event.id, is24hReminderSent: false },
                { is24hReminderSent: true }
            );
            
            if (updateResult.affected === 0) {
                continue; // Another instance already processed this event
            }
            this.logger.log(`Sending 24-hour reminders for event: ${event.title}`);
            
            const registrations = await this.eventRegistrationRepository.find({
                where: { eventId: event.id, status: 'APPROVED' },
            });

            for (const reg of registrations) {
                await this.notificationsService.createNotification(
                    reg.userId,
                    'Yarınki Etkinlik 📅',
                    `Unutma, yarın "${event.title}" etkinliği var!`,
                    'EVENT_REMINDER',
                    event.id
                );
            }
        }
    }

    // Run every Monday at 10:00 AM to encourage networking
    @Cron('0 10 * * 1')
    async handleWeeklyEngagement() {
        this.logger.log('Sending weekly engagement notifications');
        
        // Find users active in the last 30 days (assuming we had a lastLogin column, if not we notify everyone with a push sub)
        const users = await this.userRepository.find();
        
        for (const user of users) {
            await this.notificationsService.createNotification(
                user.id,
                'Yeni Haftaya Harika Bir Başlangıç! 🚀',
                'Bu hafta yeni biriyle tanışmaya ne dersin? Networking sayfasına göz at ve bağlantılarını genişlet!',
                'MATCH_REQUEST' // Using this type so it redirects to networking
            );
        }
    }
}
