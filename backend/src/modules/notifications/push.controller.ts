import { Controller, Post, Body, Get, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('Push Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('push')
export class PushController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get('vapid-public-key')
    @ApiOperation({ summary: 'Get VAPID public key for web push subscription' })
    getVapidPublicKey() {
        return { publicKey: process.env.VAPID_PUBLIC_KEY };
    }

    @Post('subscribe')
    @ApiOperation({ summary: 'Subscribe to web push notifications' })
    async subscribe(@CurrentUser() user: any, @Body() subscription: any) {
        await this.notificationsService.savePushSubscription(user.sub, subscription);
        return { success: true };
    }

    @Delete('unsubscribe')
    @ApiOperation({ summary: 'Unsubscribe from web push notifications' })
    async unsubscribe(@Body() body: { endpoint: string }) {
        await this.notificationsService.removePushSubscription(body.endpoint);
        return { success: true };
    }
}
