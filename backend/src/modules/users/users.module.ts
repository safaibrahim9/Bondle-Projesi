import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserInterest } from './entities/user-interest.entity';
import { ProfileView } from './entities/profile-view.entity';
import { CloudinaryService } from '../../common/services/cloudinary.service';
import { EmailService } from '../../common/services/email.service';

import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, UserInterest, ProfileView]), 
        AuthModule,
        AuditLogModule
    ],
    controllers: [UsersController],
    providers: [UsersService, CloudinaryService, EmailService],
    exports: [UsersService],
})
export class UsersModule { }
