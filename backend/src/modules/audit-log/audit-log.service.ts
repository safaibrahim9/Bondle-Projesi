import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogService {
    constructor(
        @InjectRepository(AuditLog)
        private auditLogRepository: Repository<AuditLog>,
    ) {}

    async logAction(userId: number, action: string, details: any, ipAddress?: string) {
        const detailsString = typeof details === 'string' ? details : JSON.stringify(details);
        const log = this.auditLogRepository.create({
            adminId: userId, // adminId is used as the performer ID in the entity
            action,
            details: detailsString,
            ipAddress,
        });
        return this.auditLogRepository.save(log);
    }

    async getLogs(limit: number = 100) {
        return this.auditLogRepository.find({
            relations: ['admin'],
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
}
