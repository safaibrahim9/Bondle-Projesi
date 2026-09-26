import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    UseGuards,
    Delete,
    Ip,
    Patch,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, EventStatus, TransactionType } from '../../common/enums';
import { EventsService } from '../events/events.service';
import { CreditsService } from '../credits/credits.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { UsersService } from '../users/users.service';

import { AbuseService } from '../abuse/abuse.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminController {
    constructor(
        private readonly eventsService: EventsService,
        private readonly creditsService: CreditsService,
        private readonly abuseService: AbuseService,
        private readonly usersService: UsersService,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private readonly auditLogService: AuditLogService,
    ) { }

    @Get('reports/pending')
    @ApiOperation({ summary: 'Get pending user reports' })
    async getPendingReports() {
        return this.abuseService.getPendingReports();
    }

    @Post('reports/:id/resolve')
    @ApiOperation({ summary: 'Resolve/Close a report' })
    async resolveReport(@Param('id') id: string, @Body() body: { adminNote: string }, @CurrentUser() user: any, @Ip() ip: string) {
        const result = await this.abuseService.resolveReport(+id, body.adminNote);
        await this.auditLogService.logAction(user.sub, 'RESOLVE_REPORT', `Resolved report ID: ${id}. Note: ${body.adminNote}`, ip);
        return result;
    }

    @Get('events/pending')
    @Roles(UserRole.ADMIN, UserRole.USER, UserRole.MENTOR, UserRole.CAMPUS_AMBASSADOR)
    @ApiOperation({ summary: 'Get pending events' })
    async getPendingEvents(@CurrentUser() user: any) {
        const events = await this.eventsService.findAll({ status: EventStatus.PENDING }, true);
        if (user.role === UserRole.ADMIN) return events;
        
        const currentUser = await this.userRepository.findOne({ where: { id: user.sub } });
        
        return events.filter(e => {
            if (Number(e.assignedRepresentativeId) === Number(user.sub)) return true;
            if (e.creator?.role === UserRole.ADMIN) return false;
            if (Number(e.createdBy) === Number(user.sub)) return true;
            if (currentUser?.isBranchRepresentative && currentUser?.branch && e.creator?.branch === currentUser.branch) return true;
            return false;
        });
    }

    @Get('events/all')
    @Roles(UserRole.ADMIN, UserRole.USER, UserRole.MENTOR, UserRole.CAMPUS_AMBASSADOR)
    @ApiOperation({ summary: 'Get all events for admin panel' })
    async getAllEvents(@CurrentUser() user: any) {
        // Fetch all events regardless of status
        const events = await this.eventsService.findAll({ status: 'ALL' as any }, true);
        const currentUser = await this.userRepository.findOne({ where: { id: user.sub } });
        console.log(`[ADMIN-DEBUG] getAllEvents called by user.sub=${user.sub}, DB role=${currentUser?.role}, total events=${events.length}`);
        
        if (currentUser?.role === UserRole.ADMIN || user.role === UserRole.ADMIN) return events;
        
        const isCampusAmbassador = currentUser?.role === UserRole.CAMPUS_AMBASSADOR || user.role === UserRole.CAMPUS_AMBASSADOR;
        if (isCampusAmbassador) {
            const now = new Date();
            // Adminin eklediği, tarihi geçmemiş ve onaylı etkinlikler
            return events.filter(e => {
                const isApproved = (e.status as any) === 'approved' || (e.status as any) === 'APPROVED';
                const isAdminCreated = e.creator?.role === UserRole.ADMIN;
                const isFuture = new Date(e.date) >= now;
                return isApproved && isAdminCreated && isFuture;
            });
        }
        console.log(`[ADMIN-DEBUG] currentUser isBranchRep=${currentUser?.isBranchRepresentative}, branch=${currentUser?.branch}`);
        if (currentUser?.isBranchRepresentative && currentUser?.branch) {
            return events.filter(e => (e as any).branch === currentUser.branch && ((e.status as any) === 'approved' || (e.status as any) === 'APPROVED'));
        }
        
        const filtered = events.filter(e => {
            const repMatch = e.assignedRepresentativeId && Number(e.assignedRepresentativeId) === Number(user.sub);
            if (repMatch) {
                console.log(`[ADMIN-DEBUG] Event ${e.id} matched by assignedRepresentativeId=${e.assignedRepresentativeId}`);
                return true;
            }
            if (e.creator?.role === UserRole.ADMIN) return false;
            if (Number(e.createdBy) === Number(user.sub)) return true;
            if (currentUser?.isBranchRepresentative && currentUser?.branch && e.creator?.branch === currentUser.branch) return true;
            return false;
        });
        console.log(`[ADMIN-DEBUG] Filtered events count: ${filtered.length}`);
        return filtered;
    }

    @Post('events/:id/approve')
    @Roles(UserRole.ADMIN, UserRole.USER, UserRole.CAMPUS_AMBASSADOR)
    @ApiOperation({ summary: 'Approve event' })
    async approveEvent(@Param('id') id: string, @CurrentUser() user: any, @Ip() ip: string) {
        await this.assertAdminOrBranchRep(user.sub);
        const result = await this.eventsService.approveEvent(+id, user.sub);
        await this.auditLogService.logAction(user.sub, 'APPROVE_EVENT', `Approved event ID: ${id}`, ip);
        return result;
    }

    @Post('events/:id/reject')
    @Roles(UserRole.ADMIN, UserRole.USER, UserRole.CAMPUS_AMBASSADOR)
    @ApiOperation({ summary: 'Reject event' })
    async rejectEvent(@Param('id') id: string, @CurrentUser() user: any, @Ip() ip: string) {
        await this.assertAdminOrBranchRep(user.sub);
        const result = await this.eventsService.rejectEvent(+id);
        await this.auditLogService.logAction(user.sub, 'REJECT_EVENT', `Rejected event ID: ${id}`, ip);
        return result;
    }

    @Get('users')
    @Roles(UserRole.ADMIN, UserRole.USER, UserRole.CAMPUS_AMBASSADOR)
    @ApiOperation({ summary: 'Get all users' })
    async getAllUsers(@CurrentUser() reqUser: any) {
        const currentUser = await this.userRepository.findOne({ where: { id: reqUser.sub } });
        if (!currentUser) throw new ForbiddenException('User not found');
        
        if (currentUser.role !== UserRole.ADMIN && !currentUser.isBranchRepresentative) {
            throw new ForbiddenException('Bu işlem için yetkiniz yok.');
        }

        const whereClause = currentUser.role === UserRole.ADMIN ? {} : { branch: currentUser.branch };

        return this.userRepository.find({
            where: whereClause,
            select: [
                'id',
                'name',
                'surname',
                'email',
                'role',
                'isPremium',
                'premiumStatus',
                'isBanned',
                'city',
                'team',
                'branch',
                'branch',
                'isBranchRepresentative',
                'canCreateEvents',
                'createdAt',
            ],
            order: { createdAt: 'DESC' }
        });
    }

    @Patch('users/:id/team-branch')
    @Roles(UserRole.ADMIN, UserRole.USER, UserRole.CAMPUS_AMBASSADOR)
    @ApiOperation({ summary: 'Update user team and branch' })
    async updateUserTeamBranch(@Param('id') id: string, @Body() body: { team: string, branch: string, isBranchRepresentative?: boolean, canCreateEvents?: boolean }, @CurrentUser() user: any, @Ip() ip: string) {
        const caller = await this.userRepository.findOne({ where: { id: user.sub } });
        if (!caller) throw new ForbiddenException('User not found');

        const targetUser = await this.userRepository.findOne({ where: { id: +id } });
        if (!targetUser) throw new Error('User not found');
        
        if (caller.role !== UserRole.ADMIN) {
            if (!caller.isBranchRepresentative) {
                throw new ForbiddenException('Bu işlem için yetkiniz yok.');
            }
            if (targetUser.branch !== caller.branch) {
                throw new ForbiddenException('Sadece kendi şubenizdeki kullanıcıları güncelleyebilirsiniz.');
            }
            // Branch reps cannot change a user's branch
            if (body.branch !== undefined && body.branch !== targetUser.branch) {
                throw new ForbiddenException('Şube değiştirme yetkiniz yok.');
            }
            // Branch reps cannot change someone's branch rep status
            if (body.isBranchRepresentative !== undefined && body.isBranchRepresentative !== targetUser.isBranchRepresentative) {
                throw new ForbiddenException('İl temsilcisi statüsünü değiştirme yetkiniz yok.');
            }
        }
        
        if (body.team !== undefined) targetUser.team = body.team;
        if (body.branch !== undefined) targetUser.branch = body.branch;
        if (body.isBranchRepresentative !== undefined) targetUser.isBranchRepresentative = body.isBranchRepresentative;
        if (body.canCreateEvents !== undefined) targetUser.canCreateEvents = body.canCreateEvents;
        
        const result = await this.userRepository.save(targetUser);
        await this.auditLogService.logAction(user.sub, 'UPDATE_USER_TEAM', `Updated team/branch for user ID: ${id}`, ip);
        return result;
    }

    @Get('users/:id/referrals')
    @ApiOperation({ summary: 'Get referrals of a specific user' })
    async getUserReferrals(@Param('id') id: string) {
        return this.usersService.getReferrals(+id);
    }

    @Post('users/:id/ban')
    @ApiOperation({ summary: 'Ban user' })
    async banUser(@Param('id') id: string, @CurrentUser() user: any, @Ip() ip: string) {
        await this.assertAdmin(user.sub);
        await this.userRepository.update(+id, { isBanned: true });
        await this.auditLogService.logAction(user.sub, 'BAN_USER', `Banned user ID: ${id}`, ip);
        return { message: 'User banned successfully' };
    }

    @Post('users/:id/unban')
    @ApiOperation({ summary: 'Unban user' })
    async unbanUser(@Param('id') id: string, @CurrentUser() user: any, @Ip() ip: string) {
        await this.assertAdmin(user.sub);
        await this.userRepository.update(+id, { isBanned: false });
        await this.auditLogService.logAction(user.sub, 'UNBAN_USER', `Unbanned user ID: ${id}`, ip);
        return { message: 'User unbanned successfully' };
    }

    @Delete('users/:id')
    @ApiOperation({ summary: 'Delete user' })
    async deleteUser(@Param('id') id: string, @CurrentUser() user: any, @Ip() ip: string) {
        await this.assertAdmin(user.sub);
        const result = await this.usersService.deleteAccount(+id, ip);
        await this.auditLogService.logAction(user.sub, 'DELETE_USER', `Deleted user ID: ${id}`, ip);
        return result;
    }

    @Post('users/:id/grant-premium')
    @ApiOperation({ summary: 'Grant premium forcefully' })
    async grantPremiumToUser(@Param('id') id: string, @CurrentUser() user: any, @Ip() ip: string) {
        await this.assertAdmin(user.sub);
        await this.userRepository.update(+id, { isPremium: true, premiumStatus: 'active' });
        await this.auditLogService.logAction(user.sub, 'GRANT_PREMIUM', `Granted premium to user ID: ${id}`, ip);
        return { message: 'User granted premium status successfully' };
    }

    @Post('users/:id/revoke-premium')
    @ApiOperation({ summary: 'Revoke premium' })
    async revokePremiumFromUser(@Param('id') id: string, @CurrentUser() user: any, @Ip() ip: string) {
        await this.assertAdmin(user.sub);
        await this.userRepository.update(+id, { isPremium: false, premiumStatus: 'none' });
        await this.auditLogService.logAction(user.sub, 'REVOKE_PREMIUM', `Revoked premium from user ID: ${id}`, ip);
        return { message: 'User premium status revoked successfully' };
    }

    @Post('users/:id/role')
    @ApiOperation({ summary: 'Update user role' })
    async updateUserRole(
        @Param('id') id: string, 
        @Body() body: { role: UserRole },
        @CurrentUser() user: any, 
        @Ip() ip: string
    ) {
        await this.assertAdmin(user.sub);
        if (!body?.role || !Object.values(UserRole).includes(body.role)) {
            throw new BadRequestException('Geçersiz rol');
        }
        await this.userRepository.update(+id, { role: body.role });
        await this.auditLogService.logAction(user.sub, 'UPDATE_USER_ROLE', `Updated role to ${body.role} for user ID: ${id}`, ip);
        return { message: `User role updated to ${body.role} successfully` };
    }

    @Post('users/:id/add-credits')
    @ApiOperation({ summary: 'Manually add credits to a user' })
    async addCreditsToUser(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Ip() ip: string,
        @Body() body: { amount: number, description?: string }
    ) {
        await this.assertAdmin(user.sub);
        await this.creditsService.addCredits(
            +id,
            body.amount,
            TransactionType.MANUAL_ADJUSTMENT,
            body.description || 'Admin tarafından manuel kredi eklendi.'
        );
        await this.auditLogService.logAction(user.sub, 'ADD_CREDITS', `Added ${body.amount} credits to user ID: ${id}. Reason: ${body.description || 'N/A'}`, ip);
        return { message: `${body.amount} credits added successfully` };
    }
    @Get('stats')
    @Roles(UserRole.ADMIN, UserRole.USER, UserRole.CAMPUS_AMBASSADOR)
    @ApiOperation({ summary: 'Get admin dashboard stats' })
    async getStats(@CurrentUser() reqUser: any) {
        const currentUser = await this.userRepository.findOne({ where: { id: reqUser.sub } });
        if (!currentUser) throw new ForbiddenException('User not found');
        if (currentUser.role !== UserRole.ADMIN && !currentUser.isBranchRepresentative) {
            throw new ForbiddenException('Bu işlem için yetkiniz yok.');
        }

        if (currentUser.role === UserRole.ADMIN) {
            const { totalEvents, pendingPayments } = await this.eventsService.getStatistics();
            const totalUsers = await this.userRepository.count();
            return { totalEvents, pendingPayments, totalUsers };
        } else {
            const totalUsers = await this.userRepository.count({ where: { branch: currentUser.branch } });
            return { totalEvents: 0, pendingPayments: 0, totalUsers };
        }
    }

    @Get('payments/pending')
    @Roles(UserRole.ADMIN, UserRole.USER, UserRole.CAMPUS_AMBASSADOR)
    @ApiOperation({ summary: 'Get pending payments' })
    async getPendingPaymentsList(@CurrentUser() user: any) {
        if (user.role === UserRole.ADMIN) {
            return this.eventsService.getPendingPayments();
        }
        return []; // Branch reps don't manage payments for now
    }

    @Post('payments/:id/verify')
    @ApiOperation({ summary: 'Verify payment' })
    async verifyPayment(@Param('id') id: string, @CurrentUser() user: any, @Ip() ip: string) {
        await this.assertAdmin(user.sub);
        const result = await this.eventsService.verifyPayment(+id, user.sub);
        await this.auditLogService.logAction(user.sub, 'VERIFY_PAYMENT', `Verified payment ID: ${id}`, ip);
        return result;
    }

    @Post('payments/:id/reject')
    @ApiOperation({ summary: 'Reject payment' })
    async rejectPayment(@Param('id') id: string, @CurrentUser() user: any, @Ip() ip: string) {
        await this.assertAdmin(user.sub);
        const result = await this.eventsService.rejectPayment(+id, user.sub);
        await this.auditLogService.logAction(user.sub, 'REJECT_PAYMENT', `Rejected payment ID: ${id}`, ip);
        return result;
    }

    private async assertAdmin(userId: number) {
        const caller = await this.userRepository.findOne({ where: { id: userId } });
        if (!caller || caller.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Bu işlem için yetkiniz yok.');
        }
        return caller;
    }

    private async assertAdminOrBranchRep(userId: number) {
        const caller = await this.userRepository.findOne({ where: { id: userId } });
        if (!caller || (caller.role !== UserRole.ADMIN && !caller.isBranchRepresentative)) {
            throw new ForbiddenException('Bu işlem için yetkiniz yok.');
        }
        return caller;
    }
}
