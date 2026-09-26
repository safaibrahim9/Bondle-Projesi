import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { CloudinaryModule } from '../../common/services/cloudinary.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [ConfigModule, AuthModule, CloudinaryModule],
    controllers: [UploadController],
})
export class UploadModule { }
