import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { UserInterest } from '../users/entities/user-interest.entity';
import { Credit } from '../credits/entities/credit.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EmailService } from '../../common/services/email.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, UserInterest, Credit]),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
        }),
        forwardRef(() => NotificationsModule),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtAuthGuard, EmailService],
    exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule { }
