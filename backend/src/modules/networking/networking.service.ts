import {
    Injectable,
    NotFoundException,
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { NetworkingMatch } from './entities/networking-match.entity';
import { MeetingStatus } from '../../common/enums';
const { RtcTokenBuilder, RtcRole } = require('agora-token');
import { Connection } from './entities/connection.entity';
import { Meeting } from './entities/meeting.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { MeetingEvent } from './entities/meeting-event.entity';
import { User } from '../users/entities/user.entity';
import { CreditsService } from '../credits/credits.service';
import { UsersService } from '../users/users.service';
import { AbuseService } from '../abuse/abuse.service';
import { EngagementService } from '../engagement/engagement.service';
import {
    MatchType,
    MatchStatus,
    TransactionType,
} from '../../common/enums';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiService } from '../../common/services/ai.service';

import { UserStreak } from '../engagement/entities/user-streak.entity';
import { UserBlock } from '../abuse/entities/user-block.entity';
import { EmailService } from '../../common/services/email.service';

@Injectable()
export class NetworkingService {
    constructor(
        @InjectRepository(NetworkingMatch)
        private matchRepository: Repository<NetworkingMatch>,
        @InjectRepository(Connection)
        private connectionRepository: Repository<Connection>,
        @InjectRepository(Meeting)
        private meetingRepository: Repository<Meeting>,
        @InjectRepository(MeetingEvent)
        private meetingEventRepository: Repository<MeetingEvent>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(UserStreak)
        private streakRepository: Repository<UserStreak>,
        @InjectRepository(UserBlock)
        private blockRepository: Repository<UserBlock>,
        private creditsService: CreditsService,
        private usersService: UsersService,
        private notificationsService: NotificationsService,
        private auditLogService: AuditLogService,
        private abuseService: AbuseService,
        private engagementService: EngagementService,
        private configService: ConfigService,
        private aiService: AiService,
        private emailService: EmailService,
    ) { }

    async logMeetingEvent(userId: number, meetingId: number, eventType: 'join' | 'leave') {
        const meeting = await this.meetingRepository.findOne({ where: { id: meetingId } });
        if (!meeting) {
            throw new NotFoundException('Toplantı bulunamadı');
        }

        const event = this.meetingEventRepository.create({
            userId,
            meetingId,
            eventType: eventType as any,
        });

        return this.meetingEventRepository.save(event);
    }

    async createMatch(userId: number, targetUserId: number) {
        // Check if users exist
        await this.usersService.findOne(userId);
        await this.usersService.findOne(targetUserId);

        // Check for ANY existing active match (Pending or Accepted)
        const existingActiveMatch = await this.matchRepository.findOne({
            where: [
                { user1Id: userId, user2Id: targetUserId, status: MatchStatus.PENDING },
                { user1Id: userId, user2Id: targetUserId, status: MatchStatus.ACCEPTED },
                { user1Id: targetUserId, user2Id: userId, status: MatchStatus.PENDING },
                { user1Id: targetUserId, user2Id: userId, status: MatchStatus.ACCEPTED },
            ],
        });

        if (existingActiveMatch) {
            if (existingActiveMatch.status === MatchStatus.PENDING) {
                // Check if this pending match is stale (older than 7 days) - optional cleanup
                // For now just block
                throw new BadRequestException('Connection request already pending');
            } else {
                // Status is ACCEPTED
                // Check if connection really exists (to handle ghost matches from previous bug)
                const connection = await this.connectionRepository.findOne({
                    where: { connectedFromMatchId: existingActiveMatch.id },
                });

                if (!connection) {
                    // This is a GHOST match! The connection was deleted but match remained.
                    // We should clean it up and allow new request.
                    await this.matchRepository.remove(existingActiveMatch);
                    // Continue to create new match...
                } else {
                    throw new BadRequestException('You are already connected with this user');
                }
            }
        }

        // If no active match exists, create a new one
        // We don't care about previous rejected/cancelled matches history for limiting
        const match = this.matchRepository.create({
            user1Id: userId,
            user2Id: targetUserId,
            matchType: MatchType.FIRST, // Default to first since we allow re-connection
            matchCount: 1, // Reset count as we are treating this as a new connection
            status: MatchStatus.PENDING,
            canRematch: true,
        });

        const savedMatch = await this.matchRepository.save(match);

        // Notify target user
        const sender = await this.usersService.findOne(userId);
        if (sender) {
            await this.notificationsService.createNotification(
                targetUserId,
                'Yeni Bağlantı İsteği',
                `${sender.name} ${sender.surname || ''} size bir bağlantı isteği gönderdi.`,
                'connection_request',
            );
        }

        // 🎯 Weekly challenge: send_connection
        this.engagementService.completeChallenge(userId, 'send_connection').catch(() => {});

        return savedMatch;
    }

    async acceptMatch(matchId: number, userId: number) {
        const match = await this.matchRepository.findOne({
            where: { id: matchId },
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        // Only the target user (user2) can accept
        if (match.user2Id !== userId) {
            throw new BadRequestException('Only the matched user can accept');
        }

        // Check if connection already exists for this match
        const existingConnection = await this.connectionRepository.findOne({
            where: { connectedFromMatchId: matchId },
        });

        if (existingConnection) {
            // Connection already exists, just return it
            return existingConnection;
        }

        // Also check bidirectional user pair to prevent duplicates
        const existingPairConnection = await this.connectionRepository
            .createQueryBuilder('connection')
            .where(
                '(connection.user1Id = :user1 AND connection.user2Id = :user2) OR ' +
                '(connection.user1Id = :user2 AND connection.user2Id = :user1)',
                { user1: match.user1Id, user2: match.user2Id }
            )
            .getOne();

        if (existingPairConnection) {
            return existingPairConnection;
        }

        // Update match status
        match.status = MatchStatus.ACCEPTED;
        await this.matchRepository.save(match);

        // Create connection
        const connection = this.connectionRepository.create({
            user1Id: match.user1Id,
            user2Id: match.user2Id,
            connectedFromMatchId: match.id,
        });

        const savedConnection = await this.connectionRepository.save(connection);

        // Notify the sender that their request was accepted
        const acceptor = await this.usersService.findOne(userId);
        if (acceptor) {
            await this.notificationsService.createNotification(
                match.user1Id, // The sender
                'Bağlantı İsteği Kabul Edildi',
                `${acceptor.name} ${acceptor.surname || ''} bağlantı isteğinizi kabul etti.`,
                'connection_accepted',
            );
        }

        return savedConnection;
    }

    async rejectMatch(matchId: number, userId: number) {
        const match = await this.matchRepository.findOne({
            where: { id: matchId },
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        if (match.user2Id !== userId) {
            throw new BadRequestException('Only the matched user can reject');
        }

        match.status = MatchStatus.REJECTED;
        return this.matchRepository.save(match);
    }

    async cancelMatch(matchId: number, userId: number) {
        const match = await this.matchRepository.findOne({
            where: { id: matchId },
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        // Only the sender (user1) can cancel
        if (match.user1Id !== userId) {
            throw new BadRequestException('Only the sender can cancel their request');
        }

        // Can only cancel pending requests
        if (match.status !== MatchStatus.PENDING) {
            throw new BadRequestException('Can only cancel pending requests');
        }

        // Delete the match request
        await this.matchRepository.remove(match);

        return { message: 'Request cancelled successfully' };
    }

    async getMyMatches(userId: number) {
        return this.matchRepository
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.user1', 'user1')
            .leftJoinAndSelect('match.user2', 'user2')
            .where('match.user1Id = :userId OR match.user2Id = :userId', { userId })
            .orderBy('match.createdAt', 'DESC')
            .getMany();
    }

    async getMyConnections(userId: number) {
        return this.connectionRepository
            .createQueryBuilder('connection')
            .leftJoinAndSelect('connection.user1', 'user1')
            .leftJoinAndSelect('connection.user2', 'user2')
            .where(
                'connection.user1Id = :userId OR connection.user2Id = :userId',
                { userId },
            )
            .orderBy('connection.createdAt', 'DESC')
            .getMany();
    }

    async getMatchHistory(userId: number, targetUserId: number) {
        return this.matchRepository
            .createQueryBuilder('match')
            .where(
                '(match.user1Id = :userId AND match.user2Id = :targetUserId) OR (match.user1Id = :targetUserId AND match.user2Id = :userId)',
                { userId, targetUserId },
            )
            .orderBy('match.createdAt', 'ASC')
            .getMany();
    }

    async scheduleMeeting(
        userId: number,
        connectionId: number,
        meetingData: {
            scheduledDate: Date;
            location?: string;
            isOnline: boolean;
            zoomLink?: string;
            notes?: string;
        },
    ) {
        // Check if connection exists
        const connection = await this.connectionRepository.findOne({
            where: { id: connectionId },
        });

        if (!connection) {
            throw new NotFoundException('Connection not found');
        }

        // Verify user is part of this connection
        if (connection.user1Id !== userId && connection.user2Id !== userId) {
            throw new BadRequestException(
                'You can only schedule meetings with your connections',
            );
        }

        // Deduct 1 credit for scheduling meeting
        await this.creditsService.deductCredits(
            userId,
            1,
            TransactionType.NETWORKING_MATCH,
            null,
            `Meeting scheduled with connection ${connectionId}`,
        );

        // Create and save meeting
        const jitsiRoomId = `universe-meeting-${connectionId}-${Date.now()}`;

        const meeting = this.meetingRepository.create({
            connectionId,
            creatorId: userId,
            scheduledDate: meetingData.scheduledDate,
            location: meetingData.location,
            isOnline: meetingData.isOnline,
            zoomLink: meetingData.zoomLink,
            notes: meetingData.notes,
            jitsiRoomId,
            status: MatchStatus.PENDING as any, // MeetingStatus.PENDING
        });

        const savedMeeting = await this.meetingRepository.save(meeting);

        // Notify the other user in the connection (Ensure type safety by casting to Number)
        const uId = Number(userId);
        const targetUserId = Number(connection.user1Id) === uId ? Number(connection.user2Id) : Number(connection.user1Id);
        // Use userRepository directly to avoid usersService.findOne exceptions blocking email
        const sender = await this.userRepository.findOne({ where: { id: uId } });

        if (sender) {
            const motivationText = (meetingData as any).motivation || 'Belirtilmedi';
            const notesText = meetingData.notes ? ` Ek Notlar: ${meetingData.notes}` : '';

            // Vercel server ortamında toLocaleString timeZone ayarı bazen UTC'ye dönebiliyor.
            // Türkiye her zaman UTC+3 olduğu için garantili çözüm olarak 3 saat ekliyoruz.
            const dateObj = new Date(meetingData.scheduledDate);
            const trDate = new Date(dateObj.getTime() + 3 * 60 * 60 * 1000);
            
            const scheduledStr = trDate.toLocaleString('tr-TR', {
                timeZone: 'UTC',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            await this.notificationsService.createNotification(
                targetUserId,
                'Yeni Toplantı Talebi',
                `${sender.name} ${sender.surname || ''} sizinle ${scheduledStr} tarihinde bir toplantı planlamak istiyor. Görüşme Motivasyonu: ${motivationText}.${notesText}`,
                'meeting_request',
                savedMeeting.id
            );

            // Send email notification to the target user
            const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
            if (targetUser?.email) {
                this.emailService.sendMeetingRequestEmail(
                    targetUser.email,
                    targetUser.name,
                    `${sender.name} ${sender.surname || ''}`,
                    scheduledStr,
                    motivationText,
                    meetingData.notes || '',
                ).catch(emailErr => {
                    console.error('Meeting request email failed (non-blocking):', emailErr);
                });
            }
        }

        return savedMeeting;
    }

    async scheduleMeetingDirect(
        userId: number,
        targetUserId: number,
        meetingData: {
            scheduledDate: Date;
            location?: string;
            isOnline: boolean;
            zoomLink?: string;
            notes?: string;
            motivation?: string;
        },
    ) {
        const uId = Number(userId);
        const tId = Number(targetUserId);

        // Deduct 1 credit for scheduling meeting
        await this.creditsService.deductCredits(
            uId,
            1,
            TransactionType.NETWORKING_MATCH,
            null,
            `Direct meeting scheduled with user ${tId}`,
        );

        const jitsiRoomId = `universe-meeting-direct-${uId}-${tId}-${Date.now()}`;

        const meeting = this.meetingRepository.create({
            connectionId: null,
            creatorId: uId,
            scheduledDate: meetingData.scheduledDate,
            location: meetingData.location,
            isOnline: meetingData.isOnline,
            zoomLink: meetingData.zoomLink,
            notes: meetingData.notes,
            jitsiRoomId,
            status: MatchStatus.PENDING as any,
        });

        const savedMeeting = await this.meetingRepository.save(meeting);
        console.log(`[DirectMeeting] Meeting ${savedMeeting.id} created. sender=${uId}, target=${tId}`);

        // Add both users as participants so meeting is visible to both
        const [senderUser, targetUser] = await Promise.all([
            this.userRepository.findOne({ where: { id: uId } }),
            this.userRepository.findOne({ where: { id: tId } }),
        ]);
        console.log(`[DirectMeeting] senderUser=${senderUser?.id}, targetUser=${targetUser?.id}, targetEmail=${targetUser?.email}`);

        if (senderUser && targetUser) {
            savedMeeting.participants = [senderUser, targetUser] as any;
            await this.meetingRepository.save(savedMeeting);
            console.log(`[DirectMeeting] Participants saved`);
        } else {
            console.warn(`[DirectMeeting] Could not save participants — senderUser=${!!senderUser}, targetUser=${!!targetUser}`);
        }

        // Notify target user
        if (senderUser) {
            const motivationText = meetingData.motivation || 'Belirtilmedi';
            const notesText = meetingData.notes ? ` Ek Notlar: ${meetingData.notes}` : '';

            const dateObj = new Date(meetingData.scheduledDate);
            const trDate = new Date(dateObj.getTime() + 3 * 60 * 60 * 1000);
            const scheduledStr = trDate.toLocaleString('tr-TR', {
                timeZone: 'UTC',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            await this.notificationsService.createNotification(
                tId,
                'Yeni Toplantı Talebi',
                `${senderUser.name} ${senderUser.surname || ''} sizinle ${scheduledStr} tarihinde bir toplantı planlamak istiyor. Görüşme Motivasyonu: ${motivationText}.${notesText}`,
                'meeting_request',
                savedMeeting.id
            );
            console.log(`[DirectMeeting] Notification sent to user ${tId}`);

            if (targetUser?.email) {
                console.log(`[DirectMeeting] Sending email to ${targetUser.email}`);
                this.emailService.sendMeetingRequestEmail(
                    targetUser.email,
                    targetUser.name,
                    `${senderUser.name} ${senderUser.surname || ''}`,
                    scheduledStr,
                    motivationText,
                    meetingData.notes || '',
                ).then(() => {
                    console.log(`[DirectMeeting] Email sent successfully to ${targetUser.email}`);
                }).catch(emailErr => {
                    console.error(`[DirectMeeting] Email FAILED to ${targetUser.email}:`, emailErr);
                });
            } else {
                console.warn(`[DirectMeeting] No email for targetUser ${tId} — skipping email`);
            }
        } else {
            console.warn(`[DirectMeeting] senderUser not found, skipping notification and email`);
        }

        return savedMeeting;
    }

    async acceptMeeting(meetingId: number, userId: number) {
        const meeting = await this.meetingRepository.findOne({
            where: { id: meetingId },
            relations: ['participants'],
        });

        if (!meeting) {
            throw new NotFoundException('Toplantı bulunamadı');
        }

        let senderId: number;

        if (meeting.connectionId) {
            // Connection-based meeting
            const connection = await this.connectionRepository.findOne({
                where: { id: meeting.connectionId },
            });
            if (!connection || (Number(connection.user1Id) !== Number(userId) && Number(connection.user2Id) !== Number(userId))) {
                throw new UnauthorizedException('Bu işlemi yapmaya yetkiniz yok');
            }
            senderId = Number(connection.user1Id) === Number(userId) ? Number(connection.user2Id) : Number(connection.user1Id);
        } else {
            // Direct meeting — check participants
            const isParticipant = meeting.participants?.some(p => Number(p.id) === Number(userId));
            if (!isParticipant) {
                throw new UnauthorizedException('Bu işlemi yapmaya yetkiniz yok');
            }
            senderId = Number(meeting.creatorId);
        }

        meeting.status = 'scheduled' as any;
        await this.meetingRepository.save(meeting);

        // Notify sender
        const acceptor = await this.usersService.findOne(userId);
        if (acceptor && senderId) {
            await this.notificationsService.createNotification(
                senderId,
                'Toplantı Talebi Kabul Edildi',
                `${acceptor.name} ${acceptor.surname || ''} toplantı talebinizi kabul etti.`,
                'meeting_accepted',
                meeting.id
            );
        }

        return meeting;
    }

    async rejectMeeting(meetingId: number, userId: number) {
        const meeting = await this.meetingRepository.findOne({
            where: { id: meetingId },
            relations: ['participants'],
        });

        if (!meeting) {
            throw new NotFoundException('Toplantı bulunamadı');
        }

        let senderId: number;

        if (meeting.connectionId) {
            const connection = await this.connectionRepository.findOne({
                where: { id: meeting.connectionId },
            });
            if (!connection || (Number(connection.user1Id) !== Number(userId) && Number(connection.user2Id) !== Number(userId))) {
                throw new UnauthorizedException('Bu işlemi yapmaya yetkiniz yok');
            }
            senderId = Number(connection.user1Id) === Number(userId) ? Number(connection.user2Id) : Number(connection.user1Id);
        } else {
            const isParticipant = meeting.participants?.some(p => Number(p.id) === Number(userId));
            if (!isParticipant) {
                throw new UnauthorizedException('Bu işlemi yapmaya yetkiniz yok');
            }
            senderId = Number(meeting.creatorId);
        }

        meeting.status = 'rejected' as any;
        await this.meetingRepository.save(meeting);

        // Notify sender
        const rejector = await this.usersService.findOne(userId);
        if (rejector && senderId) {
            await this.notificationsService.createNotification(
                senderId,
                'Toplantı İptal Edildi',
                `${rejector.name} ${rejector.surname || ''} toplantı talebini iptal etti.`,
                'meeting_rejected'
            );
        }

        return meeting;
    }

    async rescheduleMeeting(meetingId: number, userId: number, data: { scheduledDate: Date; notes?: string }) {
        const meeting = await this.meetingRepository.findOne({
            where: { id: meetingId },
            relations: ['participants'],
        });

        if (!meeting) {
            throw new NotFoundException('Toplantı bulunamadı');
        }

        let otherUserId: number;

        if (meeting.connectionId) {
            const connection = await this.connectionRepository.findOne({
                where: { id: meeting.connectionId },
            });

            if (!connection || (Number(connection.user1Id) !== Number(userId) && Number(connection.user2Id) !== Number(userId))) {
                throw new UnauthorizedException('Bu işlemi yapmaya yetkiniz yok');
            }
            otherUserId = Number(connection.user1Id) === Number(userId) ? Number(connection.user2Id) : Number(connection.user1Id);
        } else {
            const isParticipant = meeting.participants?.some(p => Number(p.id) === Number(userId));
            if (!isParticipant) {
                throw new UnauthorizedException('Bu işlemi yapmaya yetkiniz yok');
            }
            const other = meeting.participants?.find(p => Number(p.id) !== Number(userId));
            otherUserId = other ? Number(other.id) : (Number(meeting.creatorId) === Number(userId) ? null : Number(meeting.creatorId));
        }

        // Only allow rescheduling if it is pending or scheduled
        if (meeting.status !== ('pending' as any) && meeting.status !== ('scheduled' as any)) {
            throw new BadRequestException('Bu toplantı yeniden planlanamaz');
        }

        meeting.scheduledDate = new Date(data.scheduledDate);
        
        if (data.notes) {
            const rescheduleNote = `[Yeniden Planlama Notu]: ${data.notes}`;
            meeting.notes = meeting.notes ? `${meeting.notes}\n\n${rescheduleNote}` : rescheduleNote;
        }

        // Set back to pending so the OTHER user has to accept
        meeting.status = 'pending' as any;

        await this.meetingRepository.save(meeting);

        // Notify the OTHER user
        const rescheduler = await this.usersService.findOne(userId);

        if (rescheduler && otherUserId) {
            // Vercel timeZone fix
            const dateObj = new Date(meeting.scheduledDate);
            const trDate = new Date(dateObj.getTime() + 3 * 60 * 60 * 1000);
            const dateStr = trDate.toLocaleString('tr-TR', {
                timeZone: 'UTC',
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            await this.notificationsService.createNotification(
                otherUserId,
                'Toplantı Yeniden Planlandı',
                `${rescheduler.name} ${rescheduler.surname || ''} toplantıyı ${dateStr} tarihine yeniden planlamayı teklif etti.${data.notes ? ` Not: ${data.notes}` : ''}`,
                'meeting_request', // Use meeting_request so it shows Accept/Reject buttons
                meeting.id
            );
        }

        return meeting;
    }

    async completeMeeting(meetingId: number, userId: number) {
        const meeting = await this.meetingRepository.findOne({
            where: { id: meetingId },
            relations: ['participants'],
        });

        if (!meeting) {
            throw new NotFoundException('Toplantı bulunamadı');
        }

        if (meeting.connectionId) {
            const connection = await this.connectionRepository.findOne({
                where: { id: meeting.connectionId },
            });

            if (!connection || (Number(connection.user1Id) !== Number(userId) && Number(connection.user2Id) !== Number(userId))) {
                throw new UnauthorizedException('Bu işlemi yapmaya yetkiniz yok');
            }
        } else {
            const isParticipant = meeting.participants?.some(p => Number(p.id) === Number(userId));
            if (!isParticipant) {
                throw new UnauthorizedException('Bu işlemi yapmaya yetkiniz yok');
            }
        }

        meeting.status = MeetingStatus.COMPLETED;
        await this.meetingRepository.save(meeting);

        return meeting;
    }

    async getUserMeetings(userId: number) {
        // Find meetings where connectionId involves user OR participants include user
        return this.meetingRepository
            .createQueryBuilder('meeting')
            .leftJoinAndSelect('meeting.participants', 'participant')
            .leftJoinAndSelect('meeting.connection', 'connection')
            .leftJoinAndSelect('connection.user1', 'user1')
            .leftJoinAndSelect('connection.user2', 'user2')
            .where(new Brackets(qb => {
                qb.where('participant.id = :userId', { userId })
                  .orWhere('connection.user1Id = :userId', { userId })
                  .orWhere('connection.user2Id = :userId', { userId });
            }))
            .andWhere('meeting.status NOT IN (:...excludedStatuses)', { excludedStatuses: ['rejected', 'cancelled', 'pending', 'completed'] })
            .orderBy('meeting.scheduledDate', 'DESC')
            .getMany();
    }

    async getPendingMeetings(userId: number, type: 'incoming' | 'outgoing') {
        // Step 1: Get pending meetings via connection
        const connectionMeetings = await this.meetingRepository
            .createQueryBuilder('meeting')
            .leftJoinAndSelect('meeting.connection', 'connection')
            .leftJoinAndSelect('connection.user1', 'user1')
            .leftJoinAndSelect('connection.user2', 'user2')
            .where('meeting.status = :status', { status: 'pending' })
            .andWhere(new Brackets(qb => {
                qb.where('connection.user1Id = :userId', { userId })
                  .orWhere('connection.user2Id = :userId', { userId });
            }))
            .getMany();

        // Step 2: Get ALL pending direct meetings and filter by participants in JS
        // (avoids SQL column name issues with meeting_participants join table)
        const allPending = await this.meetingRepository.find({
            where: { status: 'pending' as any },
            relations: ['participants'],
        });
        const directMeetings = allPending.filter(m =>
            !m.connectionId &&
            m.participants?.some(p => Number(p.id) === Number(userId))
        );

        // Step 3: Merge and deduplicate
        const seen = new Set<number>();
        const all = [...connectionMeetings, ...directMeetings].filter(m => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
        });

        // Step 4: Filter outgoing vs incoming
        const filtered = all.filter(m =>
            type === 'outgoing'
                ? Number(m.creatorId) === Number(userId)
                : Number(m.creatorId) !== Number(userId)
        );

        // Step 5: Ensure participants are loaded (connection meetings may not have them)
        for (const meeting of filtered) {
            if (!meeting.participants || meeting.participants.length === 0) {
                const full = await this.meetingRepository.findOne({
                    where: { id: meeting.id },
                    relations: ['participants'],
                });
                meeting.participants = full?.participants || [];
            }
        }

        return filtered.sort((a, b) =>
            new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
        );
    }

    async getMeetingById(meetingId: number, userId: number) {
        const meeting = await this.meetingRepository.findOne({
            where: { id: meetingId },
            relations: ['participants']
        });

        if (!meeting) {
            throw new NotFoundException('Meeting not found');
        }

        if (meeting.status === MeetingStatus.COMPLETED) {
            console.log(`Bypassing completed check for meeting ${meetingId}`);
            // throw new BadRequestException('Bu toplantı daha önce tamamlanmış. Tekrar giriş yapılamaz.');
        }

        // Bağlantı detaylarını ve diğer kullanıcının bilgilerini getir
        let hasAccess = false;
        let otherUser = null;
        let otherUsers = [];

        if (meeting.participants && meeting.participants.length > 0) {
            hasAccess = meeting.participants.some(p => p.id === userId);
            otherUsers = meeting.participants.filter(p => p.id !== userId);
            if (otherUsers.length > 0) {
                otherUser = otherUsers[0]; // For backwards compatibility
            }
        }

        if (!hasAccess && meeting.connectionId) {
            const connection = await this.connectionRepository.findOne({
                where: { id: meeting.connectionId },
                relations: ['user1', 'user2'], // Kullanıcı detaylarını çek
            });

            if (connection) {
                if (Number(connection.user1Id) === Number(userId) || Number(connection.user2Id) === Number(userId)) {
                    hasAccess = true;
                    otherUser = Number(connection.user1Id) === Number(userId) ? connection.user2 : connection.user1;
                }
            }
        }

        if (!hasAccess) {
            // Check if user is an admin
            const user = await this.usersService.findOne(userId);
            if (user?.role === 'admin' || user?.email === 'ibrahimsafa1903@gmail.com') {
                hasAccess = true;
            }
        }

        if (!hasAccess) {
            throw new BadRequestException('Bu toplantıya erişim yetkiniz yok');
        }

        // Toplantı süresi hesaplaması: İki kişinin de aynı anda odada bulunduğu sürelerin toplamı
        const events = await this.meetingEventRepository.find({
            where: { meetingId },
            order: { timestamp: 'ASC' }
        });

        let accumulatedTime = 0;
        let intervalStart: number | null = null;
        const usersInRoom = new Set<number>();

        for (const event of events) {
            if (event.eventType === ('join' as any)) {
                usersInRoom.add(event.userId);
                // İki kişi de geldiğinde interval başlar
                if (usersInRoom.size === 2 && !intervalStart) {
                    intervalStart = new Date(event.timestamp).getTime();
                }
            } else if (event.eventType === ('leave' as any)) {
                usersInRoom.delete(event.userId);
                // Biri çıktığında interval biter ve süre eklenir
                if (usersInRoom.size < 2 && intervalStart) {
                    accumulatedTime += new Date(event.timestamp).getTime() - intervalStart;
                    intervalStart = null;
                }
            }
        }

        return {
            ...meeting,
            otherUser, // Frontend'de isim göstermek için gerekli (geriye dönük uyumluluk)
            otherUsers, // Yeni çoklu katılımcı desteği için
            accumulatedTime,
            intervalStart
        };
    }

    async assignMeetingByAdmin(
        dto: { participantIds: number[], content: string, type: string, title?: string, durationLimit?: number, scheduledDate?: Date, zoomLink?: string },
        adminId: number,
        ip: string
    ) {
        const { participantIds, content, type, title, durationLimit, zoomLink } = dto;
        
        if (!participantIds || participantIds.length < 2) {
            throw new BadRequestException('En az iki kullanıcı seçmelisiniz.');
        }

        const users = await this.userRepository.findByIds(participantIds);
        if (users.length !== participantIds.length) {
            throw new BadRequestException('Bazı kullanıcılar bulunamadı.');
        }

        // 1. Önce bu kişiler arasında bir bağlantı (Connection) var mı bak, yoksa oluştur (geriye dönük uyumluluk için, eğer 2 kişi seçilmişse)
        let connectionId = null;
        if (participantIds.length === 2) {
            const mentorId = participantIds[0];
            const menteeId = participantIds[1];
            let connection = await this.connectionRepository.findOne({
                where: [
                    { user1Id: mentorId, user2Id: menteeId },
                    { user1Id: menteeId, user2Id: mentorId }
                ]
            });

            if (!connection) {
                connection = this.connectionRepository.create({
                    user1Id: mentorId,
                    user2Id: menteeId
                });
                connection = await this.connectionRepository.save(connection);
            }
            connectionId = connection.id;
        }

        const meetingTitle = title || (type === 'mentorship' ? 'Mentorluk Görüşmesi' : 'Networking Görüşmesi');

        // 2. Görüşmeyi bu bağlantıya ata ve katılımcıları ekle
        const meeting = this.meetingRepository.create({
            connectionId: connectionId,
            scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : new Date(),
            status: MeetingStatus.SCHEDULED,
            isOnline: true,
            title: meetingTitle,
            notes: content,
            meetingType: type,
            durationLimit: durationLimit !== undefined ? durationLimit : 25,
            jitsiRoomId: `admin_${Math.random().toString(36).substring(7)}`,
            zoomLink: zoomLink || null,
            participants: users
        });

        const savedMeeting = await this.meetingRepository.save(meeting);

        // Audit Log
        try {
            await this.auditLogService.logAction(
                adminId,
                'ASSIGN_MEETING',
                `Admin (ID: ${adminId}) assigned a meeting (${meetingTitle}) for ${participantIds.length} users.`,
                ip
            );
        } catch (err) {
            console.error('Audit log error:', err);
        }

        // 3. Her kullanıcıya da bildirim gönder
        try {
            const dateStr = new Date(savedMeeting.scheduledDate).toLocaleString('tr-TR', {
                timeZone: 'Europe/Istanbul',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            const notificationMsg = `Sizin için ${dateStr} tarihinde bir görüşme planlandı: ${meetingTitle}`;
            
            for (const user of users) {
                await this.notificationsService.createNotification(
                    user.id,
                    'Yeni Görüşme Atandı',
                    notificationMsg,
                    'meeting',
                    savedMeeting.id
                );
            }
        } catch (err) {
            console.error('Bildirim gönderilirken hata oluştu:', err);
        }

        return savedMeeting;
    }

    async getMeetingToken(meetingId: string | number, userId: number, userName: string) {
        let channelName = '';
        let meetingType = 'event';
        let accumulatedTime = 0;
        let intervalStart = null;
        let durationLimit = null; // null means no limit

        if (typeof meetingId === 'string' && meetingId.startsWith('event-')) {
            // Event tabanlı genel odalar
            channelName = meetingId;
        } else {
            // 1-1 Networking veya Admin Atamalı Görüşmeler
            const mId = Number(meetingId);
            const meeting = await this.getMeetingById(mId, userId);
            channelName = `meeting-${mId}`;
            meetingType = (meeting as any).meetingType || 'networking';
            accumulatedTime = (meeting as any).accumulatedTime || 0;
            intervalStart = (meeting as any).intervalStart || null;
            durationLimit = (meeting as any).durationLimit !== undefined ? (meeting as any).durationLimit : 25;
        }
        
        const appId = process.env.AGORA_APP_ID;
        const appCertificate = process.env.AGORA_APP_CERTIFICATE;
        
        if (!appId || !appCertificate) {
            throw new Error('Agora App ID veya Certificate eksik!');
        }

        const uid = userId; // Kullanıcının gerçek ID'si ile token üretiyoruz
        const role = RtcRole.PUBLISHER;
        const privilegeExpireTime = Math.floor(Date.now() / 1000) + 3600 * 24; // 24 saat geçerli token

        const rtmTokenBuilder = require('agora-token').RtmTokenBuilder;
        
        const token = RtcTokenBuilder.buildTokenWithUid(
            appId,
            appCertificate,
            channelName,
            uid,
            role,
            privilegeExpireTime
        );

        const screenUid = uid + 1000000;
        const screenToken = RtcTokenBuilder.buildTokenWithUid(
            appId,
            appCertificate,
            channelName,
            screenUid,
            role,
            privilegeExpireTime
        );
        
        let rtmToken = '';
        try {
            rtmToken = rtmTokenBuilder.buildToken(
                appId,
                appCertificate,
                userId.toString(),
                privilegeExpireTime
            );
        } catch (e) {
            console.error('Failed to generate RTM token:', e);
        }

        return { 
            token: token,
            screenToken: screenToken,
            rtmToken: rtmToken,
            channelName: channelName,
            uid: uid,
            screenUid: screenUid,
            appId: appId,
            meetingType: meetingType,
            accumulatedTime: accumulatedTime,
            intervalStart: intervalStart,
            durationLimit: durationLimit
        };
    }

    async getIncomingRequests(userId: number) {
        return this.matchRepository
            .createQueryBuilder('match')
            .where('match.user2Id = :userId', { userId })
            .andWhere('match.status = :status', { status: MatchStatus.PENDING })
            .leftJoinAndSelect('match.user1', 'sender') // Join sender details
            .orderBy('match.createdAt', 'DESC')
            .getMany();
    }

    async deleteConnection(connectionId: number, userId: number) {
        // Find connection
        const connection = await this.connectionRepository.findOne({
            where: { id: connectionId },
        });

        if (!connection) {
            throw new NotFoundException('Connection not found');
        }

        // Verify user is part of this connection
        if (
            connection.user1Id !== userId &&
            connection.user2Id !== userId
        ) {
            throw new UnauthorizedException('Unauthorized to delete this connection');
        }

        // Delete associated meetings first (cascade delete)
        await this.meetingRepository.delete({
            connectionId: connectionId,
        });

        // Store match ID to delete after connection is removed
        const matchId = connection.connectedFromMatchId;

        // Delete the connection FIRST to resolve Foreign Key constraint
        await this.connectionRepository.remove(connection);

        // THEN Delete associated match (if exists) -> Ghost cleanup
        if (matchId) {
            await this.matchRepository.delete({
                id: matchId,
            });
        }

        return { message: 'Connection deleted successfully' };
    }

    async getSuggestions(userId: number, searchQuery?: string) {
        // Get all my matching history (Pending, Accepted, Rejected?)
        // User wants to filter:
        // 1. Current connections (Accepted)
        // 2. Pending requests (Pending)
        // 3. Themselves (Handled by UsersService)

        const matches = await this.matchRepository.find({
            where: [
                { user1Id: userId, status: MatchStatus.PENDING },
                { user2Id: userId, status: MatchStatus.PENDING },
                { user1Id: userId, status: MatchStatus.ACCEPTED },
                { user2Id: userId, status: MatchStatus.ACCEPTED },
            ],
            select: ['user1Id', 'user2Id'],
        });

        const excludedIds = new Set<number>();

        matches.forEach((m) => {
            if (m.user1Id !== userId) excludedIds.add(m.user1Id);
            if (m.user2Id !== userId) excludedIds.add(m.user2Id);
        });

        // SAFETY NET: Also check connections table directly
        // This ensures that if a Connection exists but the Match record is missing/weird, we still filter it.
        const connections = await this.connectionRepository.find({
            where: [{ user1Id: userId }, { user2Id: userId }],
            select: ['user1Id', 'user2Id'],
        });

        connections.forEach((c) => {
            if (c.user1Id !== userId) excludedIds.add(c.user1Id);
            if (c.user2Id !== userId) excludedIds.add(c.user2Id);
        });

        // 3. EXCLUDE BLOCKED USERS (Both ways)
        const myBlocks = await this.abuseService.getMyBlockedUsers(userId);
        myBlocks.forEach(b => excludedIds.add(b.blockedId));
        
        // Also exclude users who blocked ME
        const blocksByOthers = await this.blockRepository.find({
            where: { blockedId: userId },
            select: ['blockerId']
        });
        blocksByOthers.forEach(b => excludedIds.add(b.blockerId));

        // Call UsersService with exclusion list and optional search query
        return this.usersService.getAvailableForNetworking(
            userId,
            Array.from(excludedIds),
            searchQuery,
        );
    }

    async getAiSuggestions(userId: number) {
        // 1. Get current user
        const currentUser = await this.usersService.findOne(userId);
        
        // Check cache first (24 hour cache)
        const streak = await this.streakRepository.findOne({ where: { userId } });
        if (streak?.lastNetworkingAiSuggestion && streak?.lastNetworkingAiSuggestionDate) {
            const cacheAge = Date.now() - new Date(streak.lastNetworkingAiSuggestionDate).getTime();
            if (cacheAge < 24 * 60 * 60 * 1000) {
                console.log(`[NetworkingService] Returning cached AI suggestions for user ${userId}`);
                try {
                    const cachedData = JSON.parse(streak.lastNetworkingAiSuggestion);
                    // Validate if suggested users still exist
                    const validatedResults = await Promise.all(cachedData.map(async (item: any) => {
                        try {
                            const userObj = await this.userRepository.findOne({ 
                                where: { id: item.user.id },
                                relations: ['interests'] 
                            });
                            if (userObj) {
                                // Flatten interests like in UsersService
                                const processedUser = {
                                    ...userObj,
                                    interests: userObj.interests ? userObj.interests.map(i => i.interestCategory) : []
                                };
                                return { ...item, user: processedUser };
                            }
                            return null;
                        } catch { return null; }
                    }));
                    
                    const filtered = validatedResults.filter(Boolean);
                    if (filtered.length > 0) return filtered;
                } catch (e) {
                    console.warn("Failed to parse cached networking suggestions:", e.message);
                }
            }
        }

        // 2. Get base suggestions (filter out connected/pending/blocked)
        const allSuggestions = await this.getSuggestions(userId);
        
        if (allSuggestions.length === 0) {
            return [];
        }

        // Limit to 10 for AI processing
        const candidates = allSuggestions.slice(0, 10);

        const prompt = `
        Sen akıllı bir networking asistanısın. Görevin, sana verilen kullanıcıya en uygun bağlantı (network) adaylarını seçmek ve KULLANICIYA DOĞRUDAN HİTAP EDEREK "neden bu kişiyle bağlantı kurması gerektiğini" açıklamaktır.

        Mevcut Kullanıcı (Bu kullanıcıya doğrudan hitap et):
        - Adı: ${currentUser.name}
        - Ünvan: ${currentUser.title || 'Belirtilmedi'}
        - İlgi Alanları: ${currentUser.interests?.join(', ') || 'Belirtilmedi'}
        - Biyografi: ${currentUser.bio || 'Belirtilmedi'}

        Adaylar:
        ${candidates.map(c => `ID: ${c.id} | Ad: ${c.name} | Ünvan: ${c.title} | İlgi Alanları: ${c.interests?.join(', ')} | Bio: ${c.bio}`).join('\n')}

        Görev: Adaylar arasından mevcut kullanıcı için en iyi 5 eşleşmeyi seç. 
        Her eşleşme için NEDEN bu kişinin önerildiğini anlatan DOĞRUDAN, KISA ve FAYDA ODAKLI bir "reason" (gerekçe) yaz.

        ÇOK ÖNEMLİ KURALLAR:
        1. KESİNLİKLE YAPMA: "Bu kişinin biyografisinde müzik dinlemekten bahsediliyor", "Profiline göre", "Bu kişinin bio'sunda", "AI olarak düşünüyorum" gibi mekanik analiz kalıplarını KULLANMA. Üçüncü şahıs analizi ("İbrahim ve Kübra aynı tutkuya sahip") YAPMA.
        2. KULLANICIYA ODAKLAN: Doğrudan kullanıcıya neden bu eşleşmenin mantıklı olduğunu söyle. (Örn: "Senin teknoloji odaklı ilgi alanların ile bu kişinin yazılım deneyimi örtüşüyor. Projeler konusunda harika fikir alışverişleri yapabilirsiniz.")
        3. DOĞAL VE KISA OL: Robotik bir yapay zeka gibi değil, akıllı bir mentor gibi profesyonel, samimi, doğrudan ve fayda odaklı konuş. En fazla 1-2 çok kısa cümle olsun.
        4. VERİYE DAYAN: Gerçek verilerde olmayan ortak özellikleri uydurma.

        Cevabı SADECE aşağıdaki JSON formatında ver, markdown (\`\`\`json) kullanma:
        [
          { "id": 1, "reason": "İkinizin de girişimcilik alanında çalışması nedeniyle fikir alışverişi için iyi bir bağlantı olabilir." }
        ]
        `;

        try {
            const responseText = await this.aiService.generateResponse(prompt);
            
            // Robust JSON extraction
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            const cleanedJson = jsonMatch ? jsonMatch[0] : responseText.replace(/```json|```/g, '').trim();
            
            const aiMatches = JSON.parse(cleanedJson);
            
            // Map the parsed IDs back to the actual user objects
            const results = aiMatches.map((match: any) => {
                const userObj = candidates.find(c => Number(c.id) === Number(match.id));
                if (userObj) {
                    return {
                        user: userObj,
                        reason: match.reason,
                        isAiMatch: true
                    };
                }
                return null;
            }).filter(Boolean);

            // Save to cache
            if (results.length > 0) {
                const streak = await this.streakRepository.findOne({ where: { userId } });
                if (streak) {
                    streak.lastNetworkingAiSuggestion = JSON.stringify(results);
                    streak.lastNetworkingAiSuggestionDate = new Date();
                    await this.streakRepository.save(streak);
                } else {
                    await this.streakRepository.save({
                        userId,
                        lastNetworkingAiSuggestion: JSON.stringify(results),
                        lastNetworkingAiSuggestionDate: new Date()
                    });
                }
            }

            return results;

        } catch (error) {
            console.error("AI Matchmaking failed, falling back to basic:", error.message);
            // Fallback to basic suggestions if AI fails
            return candidates.slice(0, 5).map(c => ({
                user: c,
                reason: "İlgi alanlarınız ve kariyer hedeflerinizdeki ortak noktalar nedeniyle fikir alışverişi için faydalı bir bağlantı olabilir.",
                isAiMatch: false
            }));
        }
    }
    async cancelMeeting(meetingId: number, userId: number) {
        const meeting = await this.meetingRepository.findOne({
            where: { id: meetingId },
            relations: ['participants']
        });

        if (!meeting) {
            throw new NotFoundException('Toplantı bulunamadı');
        }

        let isParticipant = false;
        let otherUserIds = [];

        if (meeting.participants && meeting.participants.length > 0) {
            if (meeting.participants.some(p => p.id === userId)) {
                isParticipant = true;
                otherUserIds = meeting.participants.filter(p => p.id !== userId).map(p => p.id);
            }
        }

        if (meeting.connectionId) {
            const connection = await this.connectionRepository.findOne({
                where: { id: meeting.connectionId },
            });
            if (connection && (Number(connection.user1Id) === Number(userId) || Number(connection.user2Id) === Number(userId))) {
                isParticipant = true;
                const other = Number(connection.user1Id) === Number(userId) ? connection.user2Id : connection.user1Id;
                if (!otherUserIds.includes(other)) {
                    otherUserIds.push(other);
                }
            }
        }

        if (!isParticipant) {
            throw new ForbiddenException('Bu işlemi yapmaya yetkiniz yok');
        }

        const canceller = await this.usersService.findOne(userId);

        meeting.status = 'cancelled' as any;
        await this.meetingRepository.save(meeting);

        if (canceller) {
            for (const targetId of otherUserIds) {
                await this.notificationsService.createNotification(
                    targetId,
                    'Toplantı İptal Edildi',
                    `${canceller.name} ${canceller.surname || ''} toplantıyı iptal etti.`,
                    'meeting_cancelled',
                    meeting.id
                );
            }
        }

        return meeting;
    }

    async getAllMeetingsForAdmin() {
        return this.meetingRepository.find({
            relations: ['connection', 'connection.user1', 'connection.user2', 'participants'],
            order: { scheduledDate: 'DESC' }
        });
    }

    async updateMeetingByAdmin(id: number, data: any) {
        const meeting = await this.meetingRepository.findOne({ 
            where: { id },
            relations: ['participants']
        });
        if (!meeting) throw new NotFoundException('Meeting not found');

        if (data.participantIds && Array.isArray(data.participantIds)) {
            const users = await this.userRepository.findByIds(data.participantIds);
            meeting.participants = users;
        }

        if (data.content !== undefined) meeting.notes = data.content;
        if (data.type !== undefined) meeting.meetingType = data.type;
        if (data.title !== undefined) meeting.title = data.title;
        if (data.durationLimit !== undefined) meeting.durationLimit = data.durationLimit;
        if (data.zoomLink !== undefined) meeting.zoomLink = data.zoomLink;
        if (data.scheduledDate) meeting.scheduledDate = new Date(data.scheduledDate);
        
        return this.meetingRepository.save(meeting);
    }

    async deleteMeetingByAdmin(id: number) {
        const meeting = await this.meetingRepository.findOne({ where: { id } });
        if (!meeting) throw new NotFoundException('Meeting not found');

        return this.meetingRepository.remove(meeting);
    }
}
