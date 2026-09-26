import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ClubsService } from '../clubs/clubs.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { CloudinaryService } from '../../common/services/cloudinary.service';

@Injectable()
export class AnnouncementsService {
    constructor(
        @InjectRepository(Announcement)
        private readonly announcementRepository: Repository<Announcement>,
        private readonly cloudinaryService: CloudinaryService,
        private readonly clubsService: ClubsService,
    ) { }

    async findAll(): Promise<Announcement[]> {
        return this.announcementRepository.find({
            where: [
                { isActive: true, clubId: IsNull() },
                { isActive: true, isGlobal: true }
            ],
            order: { 
                priority: 'DESC',
                isPinned: 'DESC',
                createdAt: 'DESC' 
            },
            take: 50,
        });
    }

    async findAllClubAnnouncements(): Promise<Announcement[]> {
        return this.announcementRepository.find({
            where: { isActive: true, clubId: Not(IsNull()) },
            order: { createdAt: 'DESC' },
            take: 20
        });
    }

    async findByClubId(clubId: number): Promise<Announcement[]> {
        return this.announcementRepository.find({
            where: { isActive: true, clubId },
            order: { createdAt: 'DESC' },
        });
    }

    async findAllForAdmin(): Promise<Announcement[]> {
        return this.announcementRepository.find({
            order: { 
                priority: 'DESC',
                isPinned: 'DESC',
                createdAt: 'DESC' 
            },
        });
    }

    async create(createDto: CreateAnnouncementDto, userId?: number): Promise<Announcement> {
        if (createDto.clubId && userId) {
            const isOfficial = await this.clubsService.isClubOfficial(createDto.clubId, userId);
            if (!isOfficial) {
                throw new ForbiddenException('Bu kulüp için duyuru paylaşma yetkiniz yok.');
            }
        }
        const announcement = this.announcementRepository.create(createDto);
        return this.announcementRepository.save(announcement);
    }

    async update(id: number, updateDto: Partial<CreateAnnouncementDto>, userId: number, userRole: string): Promise<Announcement> {
        const announcement = await this.announcementRepository.findOne({ where: { id } });
        if (!announcement) {
            throw new NotFoundException(`Announcement with ID ${id} not found`);
        }

        // Permission check: Admin or Club Official
        if (userRole !== 'admin') {
            if (!announcement.clubId) {
                throw new ForbiddenException('Bu genel duyuruyu düzenleme yetkiniz yok.');
            }
            const isOfficial = await this.clubsService.isClubOfficial(announcement.clubId, userId);
            if (!isOfficial) {
                throw new ForbiddenException('Bu duyuruyu düzenleme yetkiniz yok.');
            }
        }

        Object.assign(announcement, updateDto);
        return this.announcementRepository.save(announcement);
    }

    async remove(id: number, userId: number, userRole: string): Promise<void> {
        const announcement = await this.announcementRepository.findOne({ where: { id } });
        if (!announcement) {
            throw new NotFoundException(`Announcement with ID ${id} not found`);
        }

        // Permission check
        if (userRole !== 'admin') {
            if (!announcement.clubId) {
                throw new ForbiddenException('Bu genel duyuruyu silme yetkiniz yok.');
            }
            const isOfficial = await this.clubsService.isClubOfficial(announcement.clubId, userId);
            if (!isOfficial) {
                throw new ForbiddenException('Bu duyuruyu silme yetkiniz yok.');
            }
        }

        // Delete image from Cloudinary if exists
        if (announcement.image) {
            const publicId = this.extractPublicId(announcement.image);
            if (publicId) {
                await this.cloudinaryService.deleteImage(publicId);
            }
        }

        await this.announcementRepository.remove(announcement);
    }

    async uploadImage(file: any) {
        return await this.cloudinaryService.uploadImage(file, 'announcements');
    }

    async reorder(items: { id: number, priority: number }[]): Promise<void> {
        for (const item of items) {
            await this.announcementRepository.update(item.id, { priority: item.priority });
        }
    }

    async toggleGlobal(id: number): Promise<Announcement> {
        const announcement = await this.announcementRepository.findOne({ where: { id } });
        if (!announcement) {
            throw new NotFoundException(`Announcement with ID ${id} not found`);
        }
        announcement.isGlobal = !announcement.isGlobal;
        return this.announcementRepository.save(announcement);
    }

    private extractPublicId(url: string): string | null {
        const match = url.match(/\/v\d+\/(.+)\.\w+$/);
        return match ? match[1] : null;
    }
}
