import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { PushController } from './push.controller';
import { NotificationsService } from './notifications.service';
import { TasksService } from './tasks.service';
import { Notification } from './entities/notification.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { AuthModule } from '../auth/auth.module';
import { Event } from '../events/entities/event.entity';
import { EventRegistration } from '../events/entities/event-registration.entity';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification, PushSubscription, Event, EventRegistration, User]),
        forwardRef(() => AuthModule),
    ],
    controllers: [NotificationsController, PushController],
    providers: [NotificationsService, TasksService],
    exports: [NotificationsService],
})
export class NotificationsModule { }
