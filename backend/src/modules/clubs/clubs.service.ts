import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Club } from './entities/club.entity';
import { ClubMember } from './entities/club-member.entity';
import { ClubGalleryImage } from './entities/club-gallery-image.entity';
import { ClubMemberScore } from './entities/club-member-score.entity';
import { ClubMemberScoreLog } from './entities/club-member-score-log.entity';
import { CreateClubDto, UpdateClubDto } from './dto/clubs.dto';
import { CloudinaryService } from '../../common/services/cloudinary.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ClubsService {
    constructor(
        @InjectRepository(Club)
        private clubRepository: Repository<Club>,
        @InjectRepository(ClubMember)
        private clubMemberRepository: Repository<ClubMember>,
        @InjectRepository(ClubGalleryImage)
        private galleryRepository: Repository<ClubGalleryImage>,
        @InjectRepository(ClubMemberScore)
        private memberScoreRepository: Repository<ClubMemberScore>,
        @InjectRepository(ClubMemberScoreLog)
        private memberScoreLogRepository: Repository<ClubMemberScoreLog>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private cloudinaryService: CloudinaryService,
        private notificationsService: NotificationsService,
    ) { }

    async getAllClubs(city?: string) {
        const query = this.clubRepository.createQueryBuilder('club');

        // Only show approved clubs
        query.where('club.isApproved = :approved', { approved: 1 });

        if (city && city !== 'all') {
            query.andWhere('club.city = :city', { city });
        }

        return query.orderBy('club.memberCount', 'DESC').take(100).getMany();
    }

    async getManagedClubs(userId: number) {
        // Get clubs where user is president
        const presidentClubs = await this.clubRepository.find({
            where: { presidentId: userId }
        });

        // Get clubs where user is an admin member
        const adminMemberships = await this.clubMemberRepository.find({
            where: { userId, role: 'admin' as any },
            relations: ['club']
        });
        const adminClubs = adminMemberships.map(m => m.club).filter(Boolean);

        // Combine and remove duplicates
        const allManagedClubs = [...presidentClubs];
        for (const club of adminClubs) {
            if (!allManagedClubs.some(c => c.id === club.id)) {
                allManagedClubs.push(club);
            }
        }

        return allManagedClubs;
    }

    async getClubLeaderboard() {
        const clubs = await this.clubRepository.find({
            where: { isApproved: 1 },
            select: ['id', 'name', 'logoUrl', 'city'],
        });

        // Use actual member count from club_members table
        const rankedClubs = await Promise.all(clubs.map(async (club) => {
            const actualMemberCount = await this.clubMemberRepository.count({
                where: { clubId: club.id }
            });
            
            // Optionally fetch total score from club_member_scores
            const scoreQuery = await this.memberScoreRepository
                .createQueryBuilder('score')
                .select('SUM(score.totalScore)', 'totalScore')
                .where('score.clubId = :clubId', { clubId: club.id })
                .getRawOne();
                
            const totalScore = parseInt(scoreQuery?.totalScore || '0', 10);
            
            // Calculate final score based ONLY on actual members and their points
            // 1 member = 10 points base, plus their actual earned points
            const finalScore = (actualMemberCount * 10) + totalScore;
            
            return {
                ...club,
                memberCount: actualMemberCount, // Override the manual DB field with reality
                score: finalScore
            };
        }));

        return rankedClubs.sort((a, b) => b.score - a.score).slice(0, 50);
    }

    async getClubById(id: number, userId?: number): Promise<any> {
        try {
            const club = await this.clubRepository.findOne({
                where: { id },
                relations: ['president'],
            });

            if (!club) {
                throw new NotFoundException(`Club with id ${id} not found`);
            }

            let isOfficial = false;
            let isMember = false;
            if (userId) {
                isOfficial = await this.isClubOfficial(id, userId);
                const membership = await this.clubMemberRepository.findOne({
                    where: { clubId: id, userId },
                });
                isMember = !!membership;
            }

            // Fetch gallery separately to avoid join issues
            let gallery = [];
            try {
                gallery = await this.galleryRepository.find({ 
                    where: { clubId: id },
                    order: { displayOrder: 'ASC', createdAt: 'DESC' }
                });
            } catch (e) {
                console.error(`Gallery fetch error for club ${id}:`, e);
                gallery = [];
            }

            let analytics = null;
            if (isOfficial) {
                analytics = {
                    monthlyParticipation: Math.floor(Math.random() * 100) + 10,
                    engagementRate: Math.floor(Math.random() * 50) + 20,
                    topInterests: ['Yazılım', 'Tasarım', 'Girişimcilik', 'Networking', 'Sanat'],
                };
            }

            // Return plain object to avoid TypeORM instance issues
            return {
                ...JSON.parse(JSON.stringify(club)), // Clean clone
                gallery,
                isOfficial,
                isMember,
                analytics
            };
        } catch (error) {
            console.error('Error fetching club:', error);
            throw new InternalServerErrorException('Failed to fetch club details');
        }
    }

    async getClubAnalytics(clubId: number, userId: number, userRole: string) {
        const club = await this.clubRepository.findOne({ where: { id: clubId } });
        if (!club) throw new NotFoundException('Club not found');

        const isOfficial = await this.isClubOfficial(clubId, userId);
        if (!isOfficial && userRole !== 'admin' && userRole !== 'ADMIN' && club.presidentId !== userId) {
             throw new ForbiddenException('You do not have permission to view this club\'s analytics');
        }

        const totalMembers = await this.clubMemberRepository.count({ where: { clubId } });
        
        const eventsQuery = await this.clubRepository.manager
            .createQueryBuilder()
            .select('COUNT(e.id)', 'totalEvents')
            .from('events', 'e')
            .where('e.club_id = :clubId', { clubId })
            .getRawOne();
        const totalEvents = parseInt(eventsQuery?.totalEvents || '0', 10);

        const registrationsQuery = await this.clubRepository.manager
            .createQueryBuilder()
            .select('COUNT(er.id)', 'totalRegistrations')
            .from('event_registrations', 'er')
            .innerJoin('events', 'e', 'er.event_id = e.id')
            .where('e.club_id = :clubId', { clubId })
            .andWhere('er.status = :status', { status: 'APPROVED' })
            .getRawOne();
        const totalRegistrations = parseInt(registrationsQuery?.totalRegistrations || '0', 10);
        
        const checkedInQuery = await this.clubRepository.manager
            .createQueryBuilder()
            .select('COUNT(er.id)', 'checkedIn')
            .from('event_registrations', 'er')
            .innerJoin('events', 'e', 'er.event_id = e.id')
            .where('e.club_id = :clubId', { clubId })
            .andWhere('er.is_checked_in = :checkedIn', { checkedIn: 1 })
            .getRawOne();
        const totalCheckedIn = parseInt(checkedInQuery?.checkedIn || '0', 10);

        const monthlyParticipation = totalCheckedIn;
        const engagementRate = totalMembers > 0 ? Math.round((totalRegistrations / totalMembers) * 100) : 0;

        return {
            totalMembers,
            totalEvents,
            totalRegistrations,
            totalCheckedIn,
            monthlyParticipation,
            engagementRate: engagementRate > 100 ? 100 : engagementRate,
            topInterests: ['Yazılım', 'Networking', 'Kariyer', 'Girişimcilik'], 
        };
    }

    async createClub(userId: number, userRole: string, createClubDto: CreateClubDto) {
        const finalPresidentId = Number(createClubDto.presidentId) || userId;

        const club = this.clubRepository.create({
            ...createClubDto,
            presidentId: finalPresidentId,
            memberCount: createClubDto.memberCount || 1,
            isApproved: userRole === 'admin' ? 1 : 0, // Admin auto-approve
        });

        const savedClub = await this.clubRepository.save(club);

        // Add assigned president as first member
        const member = this.clubMemberRepository.create({
            clubId: savedClub.id,
            userId: finalPresidentId,
        });
        await this.clubMemberRepository.save(member);

        // Notify all admins about the new club application if it needs approval
        if (savedClub.isApproved === 0) {
            try {
                const admins = await this.userRepository.find({ where: { role: 'admin' as any } });
                for (const admin of admins) {
                    await this.notificationsService.createNotification(
                        admin.id,
                        'Yeni Kulüp Başvurusu!',
                        `${savedClub.name} isimli kulüp onayınızı bekliyor.`,
                        'CLUB_PENDING',
                        savedClub.id
                    );
                }
            } catch (err) {
                console.error('Failed to notify admins about new club:', err);
            }
        }

        return savedClub;
    }

    async updateClub(clubId: number, userId: number, userRole: string, updateClubDto: UpdateClubDto) {
        const club = await this.clubRepository.findOne({ where: { id: clubId } });
        if (!club) throw new NotFoundException('Club not found');

        // Only president or official or global ADMIN can update
        const isOfficial = await this.isClubOfficial(clubId, userId);
        if (userRole !== 'admin' && !isOfficial) {
            throw new ForbiddenException('Only club officials or admins can update club');
        }

        // Handle president change logic
        if (updateClubDto.presidentId && Number(updateClubDto.presidentId) !== Number(club.presidentId)) {
            const newPresId = Number(updateClubDto.presidentId);
            
            // Check if new president is already a member, if not add them
            const existingMember = await this.clubMemberRepository.findOne({
                where: { clubId, userId: newPresId }
            });
            
            if (!existingMember) {
                const member = this.clubMemberRepository.create({
                    clubId,
                    userId: newPresId,
                });
                await this.clubMemberRepository.save(member);
            }
        }

        // Fix for empty string presidentId causing FK violations
        const presIdStr = String(updateClubDto.presidentId);
        if (presIdStr === '' || presIdStr === '0') {
            updateClubDto.presidentId = null;
        }

        // Use direct save on the entity to ensure persistence
        Object.assign(club, updateClubDto);
        return this.clubRepository.save(club);
    }

    async uploadLogo(clubId: number, userId: number, userRole: string, file: any) {
        const club = await this.clubRepository.findOne({ where: { id: clubId } });
        if (!club) throw new NotFoundException('Club not found');

        // Only president or official or global ADMIN can upload logo
        const isOfficial = await this.isClubOfficial(clubId, userId);
        if (userRole !== 'admin' && !isOfficial) {
            throw new ForbiddenException('Only club officials or admins can upload logo');
        }

        // Delete old logo if exists
        if (club.logoUrl) {
            const publicId = this.extractPublicId(club.logoUrl);
            if (publicId) {
                try {
                    await this.cloudinaryService.deleteImage(publicId);
                } catch (e) {
                    console.error('Failed to delete old logo:', e);
                }
            }
        }

        // Upload new logo
        const { url } = await this.cloudinaryService.uploadImage(file, 'clubs');

        // Update club
        club.logoUrl = url;
        await this.clubRepository.save(club);

        return { url };
    }

    async joinClub(clubId: number, userId: number, source?: string) {
        const club = await this.getClubById(clubId);

        // Check if already member
        const existingMember = await this.clubMemberRepository.findOne({
            where: { clubId, userId },
        });

        if (existingMember) {
            throw new BadRequestException('Already a member of this club');
        }

        // Add member
        const member = this.clubMemberRepository.create({
            clubId,
            userId,
            joinSource: source || null
        });
        await this.clubMemberRepository.save(member);

        // Increment member count
        club.memberCount += 1;
        await this.clubRepository.save(club);

        // Notify Officials
        try {
            const joiningUser = await this.userRepository.findOne({ where: { id: userId } });
            await this.notifyOfficials(
                clubId,
                'Yeni Kulüp Üyesi!',
                `${joiningUser?.name || 'Bir kullanıcı'} kulübünüze katıldı.`,
                'CLUB_JOIN',
                clubId
            );
        } catch (err) {
            console.error('Failed to send club join notification:', err);
        }

        return { success: true, message: 'Successfully joined club' };
    }

    private async notifyOfficials(clubId: number, title: string, message: string, type: string, refId?: number) {
        const club = await this.clubRepository.findOne({ where: { id: clubId } });
        const officials = await this.getClubOfficials(clubId);
        
        // Notify President
        if (club?.presidentId) {
            await this.notificationsService.createNotification(club.presidentId, title, message, type, refId);
        }

        // Notify Admins
        for (const official of officials) {
            if (official.userId !== club?.presidentId) {
                await this.notificationsService.createNotification(official.userId, title, message, type, refId);
            }
        }
    }

    async leaveClub(clubId: number, userId: number) {
        const club = await this.getClubById(clubId);

        // Can't leave if you're the president
        if (club.presidentId === userId) {
            throw new ForbiddenException('Club president cannot leave club');
        }

        // Find membership
        const member = await this.clubMemberRepository.findOne({
            where: { clubId, userId },
        });

        if (!member) {
            throw new BadRequestException('Not a member of this club');
        }

        // Remove member
        await this.clubMemberRepository.remove(member);

        // Decrement member count
        club.memberCount = Math.max(0, club.memberCount - 1);
        await this.clubRepository.save(club);

        return { success: true, message: 'Successfully left club' };
    }

    async getPendingClubs() {
        return this.clubRepository.find({
            where: { isApproved: 0 },
            relations: ['president'],
            order: { createdAt: 'DESC' },
        });
    }

    async approveClub(clubId: number, adminId: number) {
        const club = await this.getClubById(clubId);

        if (club.isApproved === 1) {
            throw new BadRequestException('Club is already approved');
        }

        club.isApproved = 1;
        club.rejectionReason = null;
        await this.clubRepository.save(club);

        return { success: true, message: 'Club approved successfully', club };
    }

    async rejectClub(clubId: number, adminId: number, reason: string) {
        const club = await this.getClubById(clubId);

        club.isApproved = 2;
        club.rejectionReason = reason;
        await this.clubRepository.save(club);

        return { success: true, message: 'Club rejected', reason };
    }

    async deleteClub(clubId: number) {
        const club = await this.getClubById(clubId);

        // Delete logo from Cloudinary if exists
        if (club.logoUrl) {
            const publicId = this.extractPublicId(club.logoUrl);
            if (publicId) {
                try {
                    await this.cloudinaryService.deleteImage(publicId);
                } catch (error) {
                    console.error('Failed to delete club logo:', error);
                }
            }
        }

        // Delete gallery images from Cloudinary and DB
        const galleryImages = await this.galleryRepository.find({ where: { clubId } });
        for (const img of galleryImages) {
            if (img.imageUrl) {
                const pubId = this.extractPublicId(img.imageUrl);
                if (pubId) {
                    try {
                        await this.cloudinaryService.deleteImage(pubId);
                    } catch (err) {
                        console.error('Failed to delete gallery image:', err);
                    }
                }
            }
        }
        await this.galleryRepository.delete({ clubId });

        // Nullify references in events and announcements
        await this.clubRepository.manager.query(`UPDATE events SET "club_id" = NULL WHERE "club_id" = $1`, [clubId]);
        await this.clubRepository.manager.query(`UPDATE announcements SET "clubId" = NULL WHERE "clubId" = $1`, [clubId]);
        
        // Nullify references in community posts
        await this.clubRepository.manager.query(`UPDATE community_posts SET "clubId" = NULL WHERE "clubId" = $1`, [clubId]);

        // Delete all club members
        await this.clubMemberRepository.delete({ clubId });

        // Delete club
        await this.clubRepository.remove(club);

        return { success: true, message: 'Club deleted successfully' };
    }

    async getClubOfficials(clubId: number) {
        return this.clubMemberRepository.find({
            where: { clubId, role: 'admin' as any }, // ClubMemberRole.ADMIN
            relations: ['user'],
        });
    }

    async getClubMembers(clubId: number) {
        return this.clubMemberRepository.find({
            where: { clubId },
            relations: ['user'],
            order: { joinedAt: 'DESC' }
        });
    }

    async updateClubOfficials(clubId: number, officialUserIds: number[]) {
        // Remove existing admins (not the president)
        const club = await this.getClubById(clubId);
        
        await this.clubMemberRepository.delete({ 
            clubId, 
            role: 'admin' as any 
        });

        // Add new officials
        const officials = officialUserIds.map(userId => {
            return this.clubMemberRepository.create({
                clubId,
                userId,
                role: 'admin' as any
            });
        });

        await this.clubMemberRepository.save(officials);
        
        return { success: true, officials };
    }

    async isClubOfficial(clubId: number, userId: number): Promise<boolean> {
        if (!userId) return false;

        const club = await this.clubRepository.findOne({ 
            where: { id: clubId },
            select: ['id', 'presidentId'] 
        });
        
        if (!club) return false;
        if (Number(club.presidentId) === Number(userId)) return true;

        const member = await this.clubMemberRepository.findOne({
            where: { clubId, userId, role: 'admin' as any }
        });
        return !!member;
    }

    private extractPublicId(url: string): string | null {
        try {
            const parts = url.split('/');
            const filename = parts[parts.length - 1];
            return filename.split('.')[0];
        } catch {
            return null;
        }
    }

    async addGalleryImage(clubId: number, userId: number, userRole: string, file: any, caption?: string, eventName?: string) {
        const isOfficial = await this.isClubOfficial(clubId, userId);
        if (userRole !== 'admin' && !isOfficial) {
            throw new ForbiddenException('Only club officials or admins can add to gallery');
        }

        const { url } = await this.cloudinaryService.uploadImage(file, 'club-gallery');
        
        const image = this.galleryRepository.create({
            clubId,
            imageUrl: url,
            caption,
            eventName
        });

        return this.galleryRepository.save(image);
    }

    async removeGalleryImage(imageId: number, userId: number, userRole: string) {
        const image = await this.galleryRepository.findOne({ where: { id: imageId } });
        if (!image) throw new NotFoundException('Image not found');

        const isOfficial = await this.isClubOfficial(image.clubId, userId);
        if (userRole !== 'admin' && !isOfficial) {
            throw new ForbiddenException('Only club officials or admins can remove from gallery');
        }

        // Delete from Cloudinary
        const publicId = this.extractPublicId(image.imageUrl);
        if (publicId) {
            await this.cloudinaryService.deleteImage(publicId);
        }

        await this.galleryRepository.remove(image);
        return { success: true };
    }

    async getClubMembersWithScores(clubId: number, userId: number) {
        const isOfficial = await this.isClubOfficial(clubId, userId);
        const club = await this.clubRepository.findOne({ where: { id: clubId } });
        // Members list is visible to everyone for ranking transparency

        const members = await this.clubMemberRepository.find({
            where: { clubId },
            relations: ['user']
        });

        const scores = await this.memberScoreRepository.find({
            where: { clubId }
        });

        const scoreMap = new Map();
        for (const s of scores) {
            scoreMap.set(s.userId, s);
        }

        return members.map(m => {
            const s = scoreMap.get(m.userId);
            return {
                ...m,
                score: s ? s.totalScore : 0,
                participationRate: s ? s.participationRate : 0,
                eventsAttended: s ? s.eventsAttended : 0
            };
        });
    }

    async addMemberScore(clubId: number, userId: number, eventId: number, pointsChange: number, reason: string, verifierId: number) {
        let score = await this.memberScoreRepository.findOne({ where: { clubId, userId } });
        
        if (!score) {
            score = this.memberScoreRepository.create({
                clubId,
                userId,
                totalScore: 0,
                eventsAttended: 0,
                participationRate: 0
            });
            await this.memberScoreRepository.save(score);
        }

        // Calculate new stats
        if (reason === 'Check-in') {
            score.eventsAttended += 1;
        }

        score.totalScore += pointsChange;

        // Calculate participation rate
        const registrationsQuery = await this.clubRepository.manager
            .createQueryBuilder()
            .select('COUNT(er.id)', 'totalRegistrations')
            .from('event_registrations', 'er')
            .innerJoin('events', 'e', 'er.event_id = e.id')
            .where('e.club_id = :clubId', { clubId })
            .andWhere('er.user_id = :userId', { userId })
            .andWhere('er.status = :status', { status: 'APPROVED' })
            .getRawOne();
        const totalRegistrations = parseInt(registrationsQuery?.totalRegistrations || '0', 10);
        
        if (totalRegistrations > 0) {
            score.participationRate = (score.eventsAttended / totalRegistrations) * 100;
        } else {
            score.participationRate = 0;
        }

        await this.memberScoreRepository.save(score);

        const log = this.memberScoreLogRepository.create({
            scoreId: score.id,
            eventId,
            pointsChange,
            reason,
            createdBy: verifierId
        });
        await this.memberScoreLogRepository.save(log);

        return score;
    }



    async updateGalleryImage(imageId: number, userId: number, userRole: string, data: { caption?: string, eventName?: string }) {
        const image = await this.galleryRepository.findOne({ where: { id: imageId } });
        if (!image) throw new NotFoundException('Image not found');

        const isOfficial = await this.isClubOfficial(image.clubId, userId);
        if (userRole !== 'admin' && !isOfficial) {
            throw new ForbiddenException('Only club officials or admins can update gallery items');
        }

        if (data.caption !== undefined) image.caption = data.caption;
        if (data.eventName !== undefined) image.eventName = data.eventName;

        return this.galleryRepository.save(image);
    }

    async updateGalleryOrder(clubId: number, userId: number, userRole: string, orderData: { imageId: number, displayOrder: number }[]) {
        const isOfficial = await this.isClubOfficial(clubId, userId);
        if (userRole !== 'admin' && !isOfficial) {
            throw new ForbiddenException('Only club officials or admins can reorder gallery');
        }

        for (const item of orderData) {
            await this.galleryRepository.update(
                { id: item.imageId, clubId },
                { displayOrder: item.displayOrder }
            );
        }

        return { success: true };
    }
}
