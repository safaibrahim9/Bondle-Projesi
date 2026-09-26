import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import * as webpush from 'web-push';

@Injectable()
export class NotificationsService implements OnModuleInit {
    constructor(
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
        @InjectRepository(PushSubscription)
        private pushSubscriptionRepository: Repository<PushSubscription>,
    ) { }

    onModuleInit() {
        if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
            webpush.setVapidDetails(
                'mailto:ibrahimsafa1903@gmail.com',
                process.env.VAPID_PUBLIC_KEY,
                process.env.VAPID_PRIVATE_KEY
            );
            console.log('[WebPush] Configured successfully');
        } else {
            console.warn('[WebPush] VAPID keys not found. Push notifications will not work.');
        }
    }

    async createNotification(
        userId: number,
        title: string,
        message: string,
        type: string,
        referenceId?: number,
    ): Promise<Notification> {
        const notification = this.notificationRepository.create({
            userId,
            title,
            message,
            type,
            referenceId,
            isRead: false,
        });
        const saved = await this.notificationRepository.save(notification);

        // Trigger Web Push Notification asynchronously
        this.sendPushNotificationToUser(userId, {
            title,
            body: message,
            type,
            referenceId,
            url: this.getNotificationUrl(type, referenceId)
        }).catch(err => console.error('[WebPush] Auto-send push error:', err));

        return saved;
    }

    private getNotificationUrl(type: string, referenceId?: number): string {
        switch (type) {
            case 'EVENT_REGISTRATION':
            case 'EVENT_UNREGISTRATION':
            case 'EVENT_APPROVED':
            case 'EVENT_REJECTED':
            case 'EVENT_REMINDER':
                return referenceId ? `/events/${referenceId}` : '/events';
            case 'MATCH_REQUEST':
            case 'MATCH_ACCEPTED':
                return '/networking';
            case 'MENTOR_REQUEST':
            case 'MENTOR_ACCEPTED':
                return '/mentorship';
            default:
                return '/';
        }
    }

    async getUserNotifications(userId: number): Promise<Notification[]> {
        return this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async getUnreadCount(userId: number): Promise<number> {
        return this.notificationRepository.count({
            where: { userId, isRead: false },
        });
    }

    async markAsRead(notificationId: number): Promise<void> {
        await this.notificationRepository.update(notificationId, { isRead: true });
    }

    async markAllAsRead(userId: number): Promise<void> {
        await this.notificationRepository.update(
            { userId, isRead: false },
            { isRead: true },
        );
    }

    // --- Web Push Methods ---

    async savePushSubscription(userId: number, subscription: any): Promise<void> {
        // Check if subscription already exists for this endpoint
        const existing = await this.pushSubscriptionRepository.findOne({
            where: { endpoint: subscription.endpoint, userId },
        });

        if (!existing) {
            const newSub = this.pushSubscriptionRepository.create({
                userId,
                endpoint: subscription.endpoint,
                keys: subscription.keys,
            });
            await this.pushSubscriptionRepository.save(newSub);
        }
    }

    async removePushSubscription(endpoint: string): Promise<void> {
        await this.pushSubscriptionRepository.delete({ endpoint });
    }

    async sendPushNotificationToUser(userId: number, payload: { title: string, body: string, url?: string, type?: string, referenceId?: number }): Promise<void> {
        const subscriptions = await this.pushSubscriptionRepository.find({
            where: { userId },
        });

        if (subscriptions.length === 0) return;

        const pushPayload = JSON.stringify({
            notification: {
                title: payload.title,
                body: payload.body,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/badge.png',
                data: {
                    url: payload.url || '/',
                    type: payload.type,
                    referenceId: payload.referenceId
                },
                vibrate: [100, 50, 100],
            },
        });

        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: sub.keys
                }, pushPayload);
            } catch (error) {
                if (error.statusCode === 404 || error.statusCode === 410) {
                    console.log(`[WebPush] Subscription expired or removed: ${sub.endpoint}`);
                    await this.pushSubscriptionRepository.remove(sub);
                } else {
                    console.error('[WebPush] Send notification error:', error);
                }
            }
        }
    }
}
