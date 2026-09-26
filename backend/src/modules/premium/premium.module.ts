import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PremiumController } from './premium.controller';
import { PremiumService } from './premium.service';
import { PremiumMembership } from './entities/premium-membership.entity';
import { PremiumRequest } from './entities/premium-request.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { CreditsModule } from '../credits/credits.module';
import { MembershipExpiryService } from './cron/membership-expiry.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([PremiumMembership, PremiumRequest, User]),
        AuthModule,
        CreditsModule,
    ],
    controllers: [PremiumController],
    providers: [PremiumService, MembershipExpiryService],
    exports: [PremiumService],
})
export class PremiumModule { }
