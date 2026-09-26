import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbuseController } from './abuse.controller';
import { AbuseService } from './abuse.service';
import { Report } from './entities/report.entity';
import { UserBlock } from './entities/user-block.entity';
import { User } from '../users/entities/user.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Report, UserBlock, User]),
        AuditLogModule,
        AuthModule
    ],
    controllers: [AbuseController],
    providers: [AbuseService],
    exports: [AbuseService]
})
export class AbuseModule {}
