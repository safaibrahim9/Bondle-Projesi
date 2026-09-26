import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportReason } from './entities/report.entity';
import { UserBlock } from './entities/user-block.entity';
import { User } from '../users/entities/user.entity';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class AbuseService {
    constructor(
        @InjectRepository(Report)
        private reportRepository: Repository<Report>,
        @InjectRepository(UserBlock)
        private blockRepository: Repository<UserBlock>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private auditLogService: AuditLogService,
    ) {}

    async reportUser(reporterId: number, reportedUserId: number, reason: ReportReason, details: string, ip: string) {
        if (reporterId === reportedUserId) {
            throw new BadRequestException('Kendinizi raporlayamazsınız');
        }

        const reportedUser = await this.userRepository.findOne({ where: { id: reportedUserId } });
        if (!reportedUser) {
            throw new NotFoundException('Raporlanan kullanıcı bulunamadı');
        }

        const report = this.reportRepository.create({
            reporterId,
            reportedUserId,
            reason,
            details,
        });

        await this.reportRepository.save(report);

        await this.auditLogService.logAction(
            reporterId,
            'USER_REPORTED',
            { reportedUserId, reason, details },
            ip
        );

        return { message: 'Raporunuz iletildi. İnceleme sonrası gerekirse aksiyon alınacaktır.' };
    }

    async blockUser(blockerId: number, blockedId: number, ip: string) {
        if (blockerId === blockedId) {
            throw new BadRequestException('Kendinizi engelleyemezsiniz');
        }

        const targetUser = await this.userRepository.findOne({ where: { id: blockedId } });
        if (!targetUser) {
            throw new NotFoundException('Engellenecek kullanıcı bulunamadı');
        }

        const existingBlock = await this.blockRepository.findOne({
            where: { blockerId, blockedId }
        });

        if (existingBlock) {
            throw new BadRequestException('Bu kullanıcı zaten engelli');
        }

        const block = this.blockRepository.create({
            blockerId,
            blockedId,
        });

        await this.blockRepository.save(block);

        await this.auditLogService.logAction(
            blockerId,
            'USER_BLOCKED',
            { blockedId },
            ip
        );

        return { message: 'Kullanıcı engellendi.' };
    }

    async unblockUser(blockerId: number, blockedId: number) {
        const block = await this.blockRepository.findOne({
            where: { blockerId, blockedId }
        });

        if (!block) {
            throw new BadRequestException('Bu kullanıcı zaten engelli değil');
        }

        await this.blockRepository.remove(block);
        return { message: 'Engelleme kaldırıldı.' };
    }

    async getMyBlockedUsers(userId: number) {
        return this.blockRepository.find({
            where: { blockerId: userId },
            relations: ['blockedUser'],
            select: {
                blockedUser: {
                    id: true,
                    name: true,
                    surname: true,
                    profilePicture: true,
                    title: true
                }
            }
        });
    }

    async getPendingReports() {
        return this.reportRepository.find({
            where: { isResolved: false },
            relations: ['reporter', 'reportedUser'],
            order: { createdAt: 'DESC' }
        });
    }

    async resolveReport(reportId: number, adminNote: string) {
        const report = await this.reportRepository.findOne({ where: { id: reportId } });
        if (!report) {
            throw new NotFoundException('Rapor bulunamadı');
        }

        report.isResolved = true;
        report.adminNote = adminNote;
        await this.reportRepository.save(report);

        return { message: 'Rapor çözüldü olarak işaretlendi.' };
    }
}
