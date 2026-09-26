import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException, InternalServerErrorException, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { CloudinaryService } from '../../common/services/cloudinary.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UploadController {
    constructor(
        private readonly cloudinaryService: CloudinaryService,
        private readonly configService: ConfigService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Upload a file' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
                ],
            }),
        ) 
        file: any
    ) {
        if (file && !file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
            throw new BadRequestException(`Invalid file type: ${file.mimetype}. Only images and videos are allowed.`);
        }
        console.log('[Upload] Received file:', file?.originalname, 'Size:', file?.size, 'Type:', file?.mimetype);

        if (!file) {
            throw new BadRequestException('No file provided');
        }

        try {
            // Check if Cloudinary is configured
            const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
            if (cloudName && file.size <= 50 * 1024 * 1024) {
                // Only use Cloudinary for files under 50MB
                console.log('[Upload] Using Cloudinary...');
                return await this.cloudinaryService.uploadImage(file, 'events');
            }

            if (cloudName && file.size > 50 * 1024 * 1024) {
                console.log('[Upload] File too large for Cloudinary, saving locally...');
            }

            // Fallback: Save to local uploads directory
            console.log('[Upload] Cloudinary not configured, saving locally...');

            const uploadsDir = path.join(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const ext = path.extname(file.originalname) || '.png';
            const filename = `upload-${Date.now()}${ext}`;
            const filepath = path.join(uploadsDir, filename);

            fs.writeFileSync(filepath, file.buffer);

            // Return URL that can be served by the static file server
            const port = this.configService.get('PORT') || 3001;
            const url = `http://localhost:${port}/uploads/${filename}`;

            console.log('[Upload] File saved locally:', url);
            return { url, publicId: filename };
        } catch (error) {
            console.error('[Upload] Error:', error);
            throw new InternalServerErrorException('File upload failed: ' + (error.message || 'Unknown error'));
        }
    }
}
