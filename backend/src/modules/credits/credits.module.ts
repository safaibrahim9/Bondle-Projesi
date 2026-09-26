import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { Credit } from './entities/credit.entity';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Credit, CreditTransaction, User]), AuthModule],
    controllers: [CreditsController],
    providers: [CreditsService],
    exports: [CreditsService],
})
export class CreditsModule { }
