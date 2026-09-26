import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { UserActivityLog } from './entities/user-activity-log.entity';
import { UserEventLog } from './entities/user-event-log.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../../common/services/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserActivityLog, UserEventLog, User]),
    AuthModule,
    AiModule
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService]
})
export class AnalyticsModule {}
