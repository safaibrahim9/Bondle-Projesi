import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Event } from './entities/event.entity';
import { EventSpeaker } from './entities/event-speaker.entity';
import { EventTopic } from './entities/event-topic.entity';
import { EventRegistration } from './entities/event-registration.entity';
import { EventFeedback } from './entities/event-feedback.entity';
import { EventMessage } from './entities/event-message.entity';
import { EmailService } from '../../common/services/email.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { CreditsService } from '../credits/credits.service';
import {
    EventStatus,
    TransactionType,
    UserRole,
    PaymentStatus,
} from '../../common/enums';
import { ClubsService } from '../clubs/clubs.service';

import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { EngagementService } from '../engagement/engagement.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiService } from '../../common/services/ai.service';

@Injectable()
export class EventsService implements OnModuleInit {
    constructor(
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        @InjectRepository(EventSpeaker)
        private speakerRepository: Repository<EventSpeaker>,
        @InjectRepository(EventTopic)
        private topicRepository: Repository<EventTopic>,
        @InjectRepository(EventRegistration)
        private registrationRepository: Repository<EventRegistration>,
        @InjectRepository(EventFeedback)
        private feedbackRepository: Repository<EventFeedback>,
        @InjectRepository(EventMessage)
        private messageRepository: Repository<EventMessage>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private creditsService: CreditsService,
        private notificationsService: NotificationsService,
        private engagementService: EngagementService,
        private configService: ConfigService,
        private emailService: EmailService,
        private clubsService: ClubsService,
        private aiService: AiService,
    ) { }

    async onModuleInit() {
        // Run missing columns auto-fix
        let queryRunner;
        try {
            queryRunner = this.eventRepository.manager.connection.createQueryRunner();
            const table = await queryRunner.getTable('events');
            
            if (table) {
                const columnsToAdd = [
                    { name: 'requires_feedback', oldName: 'requiresFeedback', type: 'boolean', default: 'true' },
                    { name: 'requires_form', oldName: 'requiresForm', type: 'boolean', default: 'false' },
                    { name: 'circle_format', oldName: 'circleFormat', type: 'text', isNullable: true },
                    { name: 'event_type', oldName: 'eventType', type: 'varchar' },
                    { name: 'payment_type', oldName: 'paymentType', type: 'varchar' },
                    { name: 'is_online', oldName: 'isOnline', type: 'boolean' },
                    { name: 'zoom_link', oldName: 'zoomLink', type: 'varchar' },
                    { name: 'poster_image', oldName: 'posterImage', type: 'text' },
                    { name: 'shopier_url', oldName: 'shopierUrl', type: 'varchar' },
                    { name: 'premium_shopier_url', oldName: 'premiumShopierUrl', type: 'varchar', isNullable: true },
                    { name: 'participant_limit', oldName: 'participantLimit', type: 'int' },
                    { name: 'current_participants', oldName: 'currentParticipants', type: 'int' },
                    { name: 'created_by', oldName: 'createdBy', type: 'int' },
                    { name: 'club_id', oldName: 'clubId', type: 'int' },
                    { name: 'is_global', oldName: 'isGlobal', type: 'boolean' },
                    { name: 'approved_by', oldName: 'approvedBy', type: 'int' },
                    { name: 'approved_at', oldName: 'approvedAt', type: 'timestamp' },
                    { name: 'is_2h_reminder_sent', oldName: 'is2hReminderSent', type: 'boolean', default: 'false' },
                    { name: 'is_24h_reminder_sent', oldName: 'is24hReminderSent', type: 'boolean', default: 'false' },
                    { name: 'assigned_representative_id', oldName: 'assignedRepresentativeId', type: 'int', isNullable: true }
                ];

                for (const col of columnsToAdd) {
                    const hasNewColumn = table.findColumnByName(col.name);
                    const hasOldColumn = table.findColumnByName(col.oldName);

                    if (!hasNewColumn) {
                        if (hasOldColumn) {
                            console.log(`[EventsService] Renaming column: ${col.oldName} -> ${col.name}`);
                            await queryRunner.query(`ALTER TABLE "events" RENAME COLUMN "${col.oldName}" TO "${col.name}"`);
                        } else {
                            console.log(`[EventsService] Adding missing column: ${col.name}`);
                            const colDef = `${col.type} ${col.default ? 'DEFAULT ' + col.default : ''}`;
                            await queryRunner.query(`ALTER TABLE "events" ADD COLUMN "${col.name}" ${colDef}`);
                        }
                    }
                }
            }
            
            // Also ensure canCreateEvents column exists on users table
            try {
                await queryRunner.query(`
                    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "canCreateEvents" boolean NOT NULL DEFAULT false
                `);
                console.log('[EventsService] Ensured canCreateEvents column exists on users table');
            } catch (err) {
                console.error('[EventsService] Failed to add canCreateEvents column:', err.message);
            }

            // Ensure phone column exists on users table
            try {
                await queryRunner.query(`
                    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" varchar(20) NULL
                `);
                console.log('[EventsService] Ensured phone column exists on users table');
            } catch (err) {
                console.error('[EventsService] Failed to add phone column:', err.message);
            }

            // Ensure joinSource column exists on club_members table
            try {
                await queryRunner.query(`
                    ALTER TABLE "club_members" ADD COLUMN IF NOT EXISTS "joinSource" varchar(50) NULL
                `);
                console.log('[EventsService] Ensured joinSource column exists on club_members table');
            } catch (err) {
                console.error('[EventsService] Failed to add joinSource column:', err.message);
            }

            // Ensure extended task columns exist
            try {
                await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "dueDate" timestamp NULL`);
                await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "pinnedMessage" text NULL`);
                await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "pinnedLink" varchar(2048) NULL`);
                console.log('[EventsService] Ensured extended task columns exist');
            } catch (err) {
                console.error('[EventsService] Failed to add task columns:', err.message);
            }

            const regTable = await queryRunner.getTable('event_registrations');
            if (regTable) {
                const regCols = [
                    { name: 'event_id', oldName: 'eventId', type: 'int' },
                    { name: 'user_id', oldName: 'userId', type: 'int' },
                    { name: 'payment_status', oldName: 'paymentStatus', type: 'varchar' },
                    { name: 'registered_at', oldName: 'registeredAt', type: 'timestamp' },
                    { name: 'verified_at', oldName: 'verifiedAt', type: 'timestamp' },
                    { name: 'verified_by', oldName: 'verifiedBy', type: 'int' },
                    { name: 'first_name', oldName: 'firstName', type: 'varchar' },
                    { name: 'last_name', oldName: 'lastName', type: 'varchar' },
                    { name: 'class_level', oldName: 'classLevel', type: 'varchar' },
                    { name: 'is_checked_in', oldName: 'isCheckedIn', type: 'boolean DEFAULT false' },
                    { name: 'checked_in_at', oldName: 'checkedInAt', type: 'timestamp' },
                    { name: 'email', oldName: 'email', type: 'varchar(150)' },
                    { name: 'status', oldName: 'status', type: 'varchar(50) DEFAULT \'PENDING\'' },
                    { name: 'paymentProofUrl', oldName: 'paymentProofUrl', type: 'varchar(500)' },
                    { name: 'phone', oldName: 'phone', type: 'varchar(20)' },
                    { name: 'university', oldName: 'university', type: 'varchar(200)' },
                    { name: 'department', oldName: 'department', type: 'varchar(200)' },
                    { name: 'motivation', oldName: 'motivation', type: 'text' },
                    { name: 'expectations', oldName: 'expectations', type: 'text' }
                ];

                for (const col of regCols) {
                    const hasNew = regTable.findColumnByName(col.name);
                    const hasOld = regTable.findColumnByName(col.oldName);
                    if (!hasNew && hasOld) {
                        console.log(`[EventsService] Renaming registration column: ${col.oldName} -> ${col.name}`);
                        await queryRunner.query(`ALTER TABLE "event_registrations" RENAME COLUMN "${col.oldName}" TO "${col.name}"`);
                    } else if (!hasNew && !hasOld) {
                        console.log(`[EventsService] Adding missing registration column: ${col.name}`);
                        await queryRunner.query(`ALTER TABLE "event_registrations" ADD COLUMN "${col.name}" ${col.type}`);
                    }
                }
            }

            // Fix fake/out-of-sync participant counts
            try {
                console.log('[EventsService] Syncing current_participants with actual registrations...');
                await queryRunner.query(`
                    UPDATE events 
                    SET current_participants = COALESCE(
                        (SELECT COUNT(*) 
                         FROM event_registrations 
                         WHERE event_registrations.event_id = events.id 
                         AND (UPPER(event_registrations.status) = 'APPROVED' OR event_registrations.status IS NULL)
                        ), 0
                    )
                `);
            } catch (err) {
                console.error('[EventsService] Failed to sync participant counts:', err.message);
            }

        } catch (error) {
            console.error('[EventsService] Failed to check/add missing columns:', error.message);
        } finally {
            if (queryRunner) await queryRunner.release();
        }
    }

    async create(createEventDto: CreateEventDto, userId: number, userRole: UserRole = UserRole.USER) {
        // Fetch user to check specific permissions
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('Kullanıcı bulunamadı');
        }

        const hasGlobalEventPermission = user.role === UserRole.ADMIN || user.isBranchRepresentative || user.canCreateEvents;

        // Permission check
        if (!hasGlobalEventPermission) {
            if (createEventDto.clubId) {
                const isOfficial = await this.clubsService.isClubOfficial(createEventDto.clubId, userId);
                if (!isOfficial) {
                    throw new ForbiddenException('Bu kulüp adına etkinlik oluşturma yetkiniz yok.');
                }
            } else {
                throw new ForbiddenException('Yalnızca yöneticiler, il temsilcileri veya yetkilendirilmiş kişiler genel etkinlik oluşturabilir.');
            }
        }

        console.log(`Creating event. UserID: ${userId}, Role: ${userRole}, hasGlobalPermission: ${hasGlobalEventPermission}`);

        const event = this.eventRepository.create({
            ...createEventDto,
            date: new Date(createEventDto.date),
            createdBy: userId,
            status: EventStatus.APPROVED,
        });

        const savedEvent = await this.eventRepository.save(event);

        // Save speakers
        if (createEventDto.speakers) {
            for (const speakerName of createEventDto.speakers) {
                const speaker = this.speakerRepository.create({
                    eventId: savedEvent.id,
                    speakerName,
                });
                await this.speakerRepository.save(speaker);
            }
        }

        // Save topics
        if (createEventDto.topics) {
            for (const topic of createEventDto.topics) {
                const eventTopic = this.topicRepository.create({
                    eventId: savedEvent.id,
                    topic,
                });
                await this.topicRepository.save(eventTopic);
            }
        }

        // Notify admin about new club event
        if (createEventDto.clubId) {
            try {
                const admin = await this.userRepository.findOne({ where: { role: UserRole.ADMIN } });
                if (admin && admin.email) {
                    const club = await this.clubsService.getClubById(createEventDto.clubId).catch(() => null);
                    const clubName = club ? club.name : `ID: ${createEventDto.clubId}`;
                    await this.emailService.sendAdminNotification(
                        admin.email,
                        'Kulüp Tarafından Yeni Etkinlik Eklendi',
                        `<strong>${clubName}</strong> kulübü sisteme yeni bir etkinlik ekledi.<br>Etkinlik Adı: <strong>${savedEvent.title}</strong><br>Tarih: ${savedEvent.date.toLocaleDateString('tr-TR')}`
                    );
                    
                    // Also send in-app notification to the admin
                    await this.notificationsService.createNotification(
                        admin.id,
                        'Yeni Kulüp Etkinliği 📅',
                        `${clubName} kulübü "${savedEvent.title}" etkinliğini ekledi.`,
                        'NEW_CLUB_EVENT',
                        savedEvent.id
                    );
                }
            } catch (err) {
                console.error('Failed to send admin notification for new club event:', err);
            }
        }

        return savedEvent;
    }

    async findAll(filters?: { city?: string; status?: EventStatus | 'ALL'; clubId?: number }, includeCreator: boolean = false) {
        const query = this.eventRepository.createQueryBuilder('event');
        query.leftJoinAndSelect('event.club', 'club');

        if (includeCreator) {
            query.leftJoinAndSelect('event.creator', 'creator');
        }

        if (filters?.city) {
            query.andWhere('event.city = :city', { city: filters.city });
        }

        if (filters?.clubId) {
            query.andWhere('event.club_id = :clubId', { clubId: filters.clubId });
        }

        if (filters?.status && filters.status !== 'ALL') {
            query.andWhere('event.status = :status', { status: filters.status });
        } else if (!filters?.status) {
            // Default: only show approved events
            query.andWhere('event.status = :status', {
                status: EventStatus.APPROVED,
            });
        }

        // Sorting: Admin/Global events first, then by date
        query.addSelect('CASE WHEN (event.club_id IS NULL OR event.is_global = true) THEN 0 ELSE 1 END', 'sort_order');
        query.orderBy('sort_order', 'ASC');
        query.addOrderBy('event.date', 'ASC');

        return query.take(100).getMany();
    }

    async toggleGlobal(id: number) {
        const event = await this.findOne(id);
        event.isGlobal = !event.isGlobal;
        return this.eventRepository.save(event);
    }

    async findOne(id: number) {
        const event = await this.eventRepository.findOne({ where: { id } });
        if (!event) {
            throw new NotFoundException('Event not found');
        }
        return event;
    }

    async adminAddParticipant(eventId: number, adminId: number, email: string) {
        const event = await this.findOne(eventId);
        if (event.status !== EventStatus.APPROVED) {
            throw new BadRequestException('Event is not approved yet');
        }

        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new BadRequestException(`Sistemde ${email} adresine sahip bir kullanıcı bulunamadı.`);
        }

        const existingRegistration = await this.registrationRepository.findOne({
            where: { eventId, userId: user.id },
        });

        if (existingRegistration) {
            if (existingRegistration.status === 'APPROVED') {
                throw new BadRequestException('Bu kullanıcı zaten etkinliğe kayıtlı.');
            } else {
                // Bekleyen bir kayıt varsa onu onayla
                existingRegistration.status = 'APPROVED';
                existingRegistration.verifiedAt = new Date();
                existingRegistration.verifiedBy = adminId;
                await this.registrationRepository.save(existingRegistration);
                
                event.currentParticipants += 1;
                await this.eventRepository.save(event);
                
                return existingRegistration;
            }
        }

        if (event.currentParticipants >= event.participantLimit) {
            throw new BadRequestException('Event is full');
        }

        const registration = new EventRegistration();
        Object.assign(registration, {
            eventId,
            userId: user.id,
            email: user.email,
            firstName: user.name,
            lastName: user.surname,
            status: 'APPROVED',
            verifiedAt: new Date(),
            verifiedBy: adminId
        });

        const savedRegistration = await this.registrationRepository.save(registration);
        
        event.currentParticipants += 1;
        await this.eventRepository.save(event);

        return savedRegistration;
    }

    async registerForEvent(eventId: number, userId: number, registrationData?: any) {
        const event = await this.findOne(eventId);

        if (event.status !== EventStatus.APPROVED) {
            throw new BadRequestException('Event is not approved yet');
        }

        const existingRegistration = await this.registrationRepository.findOne({
            where: { eventId, userId },
        });

        if (existingRegistration) {
            if (existingRegistration.status === 'PENDING') {
                throw new BadRequestException('Bu etkinlik için zaten bekleyen bir başvurunuz bulunuyor.');
            }
            if (existingRegistration.status === 'APPROVED') {
                throw new BadRequestException('Bu etkinliğe zaten kayıtlısınız.');
            }
            throw new BadRequestException('Bu etkinlik için daha önce bir başvurunuz olmuş.');
        }

        if (event.currentParticipants >= event.participantLimit) {
            throw new BadRequestException('Event is full');
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });
        const hasFormData = registrationData && Object.keys(registrationData).length > 0;
        let finalStatus = (event.requiresForm || hasFormData) ? 'PENDING' : 'APPROVED';
        
        // Campus Ambassador Bypass
        if (event.isFreeForAmbassadors && user?.role === UserRole.CAMPUS_AMBASSADOR) {
            finalStatus = 'APPROVED';
        }
        
        const registration = new EventRegistration();
        Object.assign(registration, {
            eventId,
            userId,
            ...(registrationData || {}),
            status: finalStatus,
        });

        const savedRegistration = await this.registrationRepository.save(registration) as EventRegistration;
        
        // If auto-approved (no form), increment participant count immediately
        if (finalStatus === 'APPROVED') {
            event.currentParticipants += 1;
            await this.eventRepository.save(event);
        }
        console.log(
            `[EventsService] Registration saved with ID: ${savedRegistration.id}, Status: ${savedRegistration.status}`,
        );

        // Notify Admins about new registration
        const notifTitle = event.requiresForm ? 'Yeni Etkinlik Başvuru Formu' : 'Yeni Etkinlik Kaydı';
        const notifMessage = event.requiresForm 
            ? `${registrationData?.firstName || 'Bir kullanıcı'} "${event.title}" etkinliği için başvuru formu doldurdu.`
            : `${registrationData?.firstName || 'Bir kullanıcı'} "${event.title}" etkinliğine kayıt oldu.`;

        await this.notifyAdmins(
            notifTitle,
            notifMessage,
            'EVENT_REGISTRATION',
            event.id
        );

        // Notify Club Officials if it's a club event
        if (event.clubId) {
            await this.notifyClubOfficials(
                event.clubId,
                notifTitle,
                notifMessage,
                'EVENT_REGISTRATION',
                event.id
            );
        }

        // Notify Event Creator (if not admin/club official who already got notified)
        if (event.createdBy) {
            await this.notificationsService.createNotification(event.createdBy, notifTitle, notifMessage, 'EVENT_REGISTRATION', event.id);
        }

        // Notify Assigned Representative
        if (event.assignedRepresentativeId) {
            await this.notificationsService.createNotification(event.assignedRepresentativeId, notifTitle, notifMessage, 'EVENT_REGISTRATION', event.id);
        }

        // 🎯 Weekly challenge: register_event
        this.engagementService.completeChallenge(userId, 'register_event').catch(() => {});

        return savedRegistration;
    }

    private async notifyAdmins(title: string, message: string, type: string, refId?: number) {
        const admins = await this.userRepository.find({ where: { role: UserRole.ADMIN } });
        for (const admin of admins) {
            await this.notificationsService.createNotification(admin.id, title, message, type, refId);
        }
    }

    private async notifyClubOfficials(clubId: number, title: string, message: string, type: string, refId?: number) {
        const officials = await this.clubsService.getClubOfficials(clubId);
        const club = await this.clubsService.getClubById(clubId);
        
        // Notify President
        if (club.presidentId) {
            await this.notificationsService.createNotification(club.presidentId, title, message, type, refId);
        }

        // Notify Admins
        for (const official of officials) {
            if (official.userId !== club.presidentId) {
                await this.notificationsService.createNotification(official.userId, title, message, type, refId);
            }
        }
    }

    async reportPayment(eventId: number, userId: number) {
        const event = await this.findOne(eventId);
        const user = await this.userRepository.findOne({ where: { id: userId } });
        
        const userName = user?.name ? `${user.name} ${user.surname || ''}` : 'Bir kullanıcı';
        
        // Adminlere ödeme bildirimi gitmesin (İstek üzerine kaldırıldı)
        /*
        await this.notifyAdmins(
            'Ödeme Bildirimi',
            `${userName}, "${event.title}" etkinliği için ödemeyi tamamladığını bildirdi. Lütfen kontrol edip başvuruyu onaylayın.`,
            'PAYMENT_REPORT',
            event.id
        );

        if (event.clubId) {
            await this.notifyClubOfficials(
                event.clubId,
                'Ödeme Bildirimi',
                `${userName}, "${event.title}" etkinliği için ödemeyi tamamladığını bildirdi. Lütfen kontrol edip başvuruyu onaylayın.`,
                'PAYMENT_REPORT',
                event.id
            );
        }
        */

        return { success: true };
    }

    async getAllPendingRegistrations() {
        return this.registrationRepository.find({
            where: { status: 'PENDING' },
            relations: ['user', 'event'],
            order: { registeredAt: 'DESC' },
        });
    }

    async getEventRegistrations(eventId: number, userId: number, userRole: string) {
        const event = await this.findOne(eventId);
        
        if (userRole !== 'admin') {
            const isCreator = Number(event.createdBy) === Number(userId);
            const isAssignedRep = Number(event.assignedRepresentativeId) === Number(userId);
            let isOfficial = false;
            
            if (event.clubId) {
                isOfficial = await this.clubsService.isClubOfficial(event.clubId, userId);
            }
            
            if (!isCreator && !isAssignedRep && !isOfficial) {
                throw new ForbiddenException('Bu etkinliğin katılımcılarını görme yetkiniz yok.');
            }
        }

        const registrations = await this.registrationRepository.find({
            where: { eventId },
            relations: ['user'],
            order: { registeredAt: 'DESC' },
        });

        if (event.clubId) {
            const userIds = registrations.map(r => r.userId);
            if (userIds.length > 0) {
                const scores = await this.registrationRepository.manager.query(
                    'SELECT user_id, total_score, participation_rate FROM club_member_scores WHERE club_id = ? AND user_id IN (?)',
                    [event.clubId, userIds]
                );
                const scoreMap = new Map();
                scores.forEach(s => scoreMap.set(s.user_id, { score: s.total_score, rate: parseFloat(s.participation_rate) }));
                
                return registrations.map(r => {
                    const scoreData = scoreMap.get(r.userId);
                    return {
                        ...r,
                        user: {
                            ...r.user,
                            score: scoreData ? scoreData.score : 0,
                            participationRate: scoreData ? scoreData.rate : 0
                        }
                    };
                });
            }
        }

        return registrations.map(r => ({
            ...r,
            user: { ...r.user, score: 0, participationRate: 0 }
        }));
    }

    async getUserRegistrations(userId: number) {
        return this.registrationRepository.find({
            where: { userId },
            relations: ['event'],
        });
    }

    async checkInUser(eventId: number, userId: number, verifierId: number) {
        const registration = await this.registrationRepository.findOne({
            where: { eventId, userId },
            relations: ['user']
        });

        if (!registration) {
            throw new NotFoundException('Kullanıcı bu etkinliğe kayıtlı değil.');
        }

        const event = await this.eventRepository.findOne({
            where: { id: eventId }
        });

        if (!event) throw new NotFoundException('Etkinlik bulunamadı');

        const verifier = await this.userRepository.findOne({ where: { id: verifierId } });

        if (event.createdBy !== verifierId && verifier?.role !== 'admin') {
            // Further club officer checks could be added here
        }

        if (registration.isCheckedIn) {
            throw new BadRequestException('Bu kullanıcı zaten giriş yapmış.');
        }

        registration.isCheckedIn = true;
        registration.checkedInAt = new Date();
        registration.verifiedBy = verifierId;

        await this.registrationRepository.save(registration);

        if (event.clubId) {
            try {
                // Award 10 points for attending an event
                await this.clubsService.addMemberScore(event.clubId, userId, event.id, 10, 'Check-in', verifierId);
            } catch (err) {
                console.error('Error adding member score:', err);
            }
        }

        return { success: true, message: 'Check-in başarılı.', user: registration.user };
    }


    async unregisterFromEvent(eventId: number, userId: number) {
        const registration = await this.registrationRepository.findOne({
            where: { eventId, userId },
            relations: ['user']
        });

        if (!registration) {
            throw new NotFoundException('Bu etkinliğe kayıtlı değilsiniz');
        }

        const wasApproved = registration.status === 'APPROVED';
        const userName =
            registration.firstName ||
            (registration.user as any)?.name ||
            'Bir kullanıcı';

        await this.registrationRepository.remove(registration);

        const event = await this.findOne(eventId);

        if (wasApproved) {
            if (event.currentParticipants > 0) {
                event.currentParticipants -= 1;
                await this.eventRepository.save(event);
            }
        }

        // Notify Admin about unregistration
        await this.notifyAdmins(
            `Etkinlik Kaydı İptali`,
            `${userName}, "${event.title}" etkinliğinden ayrıldı.`,
            'EVENT_UNREGISTRATION',
            event.id
        );

        // Notify Club Officials if it's a club event
        if (event.clubId) {
            await this.notifyClubOfficials(
                event.clubId,
                `Etkinlik Kaydı İptali`,
                `${userName}, "${event.title}" etkinliğinizden ayrıldı.`,
                'EVENT_UNREGISTRATION',
                event.id
            );
        }

        return { success: true, message: 'Etkinlikten ayrıldınız' };
    }

    async verifyRegistration(registrationId: number, userId: number, userRole: string) {
        const registration = await this.registrationRepository.findOne({
            where: { id: registrationId },
            relations: ['event']
        });

        if (!registration) {
            throw new NotFoundException('Registration not found');
        }

        const event = await this.findOne(registration.eventId);

        if (userRole !== 'admin') {
            const isCreator = Number(event.createdBy) === Number(userId);
            const isAssignedRep = Number(event.assignedRepresentativeId) === Number(userId);
            let isOfficial = false;
            
            if (event.clubId) {
                isOfficial = await this.clubsService.isClubOfficial(event.clubId, userId);
            }
            
            if (!isCreator && !isAssignedRep && !isOfficial) {
                throw new ForbiddenException('Bu etkinliğin başvurularını yönetme yetkiniz yok.');
            }
        }

        if (registration.status === 'APPROVED') return registration;

        registration.status = 'APPROVED';
        registration.verifiedBy = userId;
        registration.verifiedAt = new Date();

        const saved = await this.registrationRepository.save(registration);

        // Increment participant count
        event.currentParticipants += 1;
        await this.eventRepository.save(event);

        // Notify User
        await this.notificationsService.createNotification(
            registration.userId,
            'Etkinlik Başvurunuz Onaylandı! 🎉',
            `"${event.title}" etkinliği için başvurunuz onaylanmıştır. Katılım detaylarını etkinlik sayfasından görebilirsiniz.`,
            'EVENT_APPROVED',
            event.id
        );

        return saved;
    }

    async rejectRegistration(registrationId: number, userId: number, userRole: string) {
        const registration = await this.registrationRepository.findOne({
            where: { id: registrationId },
            relations: ['event']
        });

        if (!registration) {
            throw new NotFoundException('Registration not found');
        }

        const event = await this.findOne(registration.eventId);

        if (userRole !== 'admin') {
            const isCreator = Number(event.createdBy) === Number(userId);
            const isAssignedRep = Number(event.assignedRepresentativeId) === Number(userId);
            let isOfficial = false;
            
            if (event.clubId) {
                isOfficial = await this.clubsService.isClubOfficial(event.clubId, userId);
            }
            
            if (!isCreator && !isAssignedRep && !isOfficial) {
                throw new ForbiddenException('Bu etkinliğin başvurularını yönetme yetkiniz yok.');
            }
        }

        const wasApproved = registration.status === 'APPROVED';
        registration.status = 'REJECTED';
        const saved = await this.registrationRepository.save(registration);

        if (wasApproved) {
            event.currentParticipants = Math.max(0, event.currentParticipants - 1);
            await this.eventRepository.save(event);
        }

        // Notify User
        await this.notificationsService.createNotification(
            registration.userId,
            'Etkinlik Başvurusu Hakkında',
            `"${event.title}" etkinliği için başvurunuz ne yazık ki olumlu sonuçlanmadı.`,
            'EVENT_REJECTED',
            registration.eventId
        );

        return saved;
    }

    async approveEvent(eventId: number, adminId: number) {
        const event = await this.findOne(eventId);
        event.status = EventStatus.APPROVED;
        event.approvedBy = adminId;
        event.approvedAt = new Date();
        return this.eventRepository.save(event);
    }

    async rejectEvent(eventId: number) {
        const event = await this.findOne(eventId);
        event.status = EventStatus.REJECTED;
        return this.eventRepository.save(event);
    }

    async deleteEvent(id: number, userId: number, userRole: string) {
        const event = await this.findOne(id);
        const currentUser = await this.userRepository.findOne({ where: { id: userId } });
        const hasGlobalEventPermission = currentUser?.role === UserRole.ADMIN || currentUser?.isBranchRepresentative || currentUser?.canCreateEvents;

        if (!hasGlobalEventPermission) {
            if (!event.clubId) {
                throw new ForbiddenException('Bu genel etkinliği silme yetkiniz yok.');
            }
            const isOfficial = await this.clubsService.isClubOfficial(event.clubId, userId);
            if (!isOfficial) {
                throw new ForbiddenException('Bu etkinliği silme yetkiniz yok.');
            }
        } else if (currentUser?.role !== UserRole.ADMIN) {
            // Branch reps and authorized users logic
            const creator = await this.userRepository.findOne({ where: { id: event.createdBy } });
            if (creator?.role === UserRole.ADMIN) {
                throw new ForbiddenException('Ana yöneticinin oluşturduğu etkinlikleri silemezsiniz.');
            }
            if (event.createdBy !== userId) {
                if (!(currentUser?.isBranchRepresentative && currentUser?.branch && creator?.branch === currentUser.branch)) {
                    throw new ForbiddenException('Sadece kendi şubenize ait etkinlikleri silebilirsiniz.');
                }
            }
        }

        return this.eventRepository.remove(event);
    }

    async getAiRecommendations(userId: number) {
        const currentUser = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['interests']
        });
        if (!currentUser) return [];

        // Get all upcoming approved events
        const upcomingEvents = await this.eventRepository.find({
            where: { status: EventStatus.APPROVED },
            order: { date: 'ASC' }
        });

        if (upcomingEvents.length === 0) return [];

        const eventData = upcomingEvents.map(e => ({
            id: e.id,
            title: e.title,
            description: e.description,
            category: e.eventType,
            location: e.location
        }));

        const prompt = `
        Sen bir üniversite etkinlik asistanısın. Görevin, kullanıcının profilini analiz ederek ona en uygun 3 etkinliği önermek.
        
        Kullanıcı Bilgileri:
        - Ad: ${currentUser.name}
        - İlgi Alanları: ${currentUser.interests?.map(i => i.interestCategory).join(', ') || 'Belirtilmedi'}
        - Biyografi: ${currentUser.bio || 'Belirtilmedi'}
        
        Mevcut Etkinlikler:
        ${JSON.stringify(eventData)}
        
        Lütfen en iyi 3 eşleşmeyi seç ve her biri için KISA, etkileyici ve kişiselleştirilmiş bir öneri cümlesi yaz (Türkçe).
        Cümleler "Seni bu etkinlikte görmeliyiz çünkü..." gibi samimi olsun.
        
        Yanıtı sadece şu JSON formatında ver:
        [
            { "eventId": number, "reason": "string" }
        ]
        `;

        try {
            const responseText = await this.aiService.generateResponse(prompt);
            
            // Robust JSON extraction
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            const cleanedJson = jsonMatch ? jsonMatch[0] : responseText.replace(/```json|```/g, '').trim();
            
            const recommendations = JSON.parse(cleanedJson);

            // Map back to full event objects
            return recommendations.map(rec => ({
                event: upcomingEvents.find(e => Number(e.id) === Number(rec.eventId)),
                recommendationReason: rec.reason
            })).filter(r => r.event);

        } catch (error) {
            console.error('AI Event Recommendation failed, falling back to basic:', error.message);
            // Fallback
            return upcomingEvents.slice(0, 3).map(event => ({
                event,
                recommendationReason: "Kariyerine değer katabilecek popüler bir etkinlik."
            }));
        }
    }

    async updateEvent(eventId: number, updateEventDto: UpdateEventDto, userId: number, userRole: string) {
        const event = await this.findOne(eventId);
        const currentUser = await this.userRepository.findOne({ where: { id: userId } });
        const hasGlobalEventPermission = currentUser?.role === UserRole.ADMIN || currentUser?.isBranchRepresentative || currentUser?.canCreateEvents;

        if (!hasGlobalEventPermission) {
            if (!event.clubId) {
                throw new ForbiddenException('Bu genel etkinliği düzenleme yetkiniz yok.');
            }
            const isOfficial = await this.clubsService.isClubOfficial(event.clubId, userId);
            if (!isOfficial) {
                throw new ForbiddenException('Bu etkinliği düzenleme yetkiniz yok.');
            }
        } else if (currentUser?.role !== UserRole.ADMIN) {
            // Branch reps and authorized users logic
            const creator = await this.userRepository.findOne({ where: { id: event.createdBy } });
            if (creator?.role === UserRole.ADMIN) {
                throw new ForbiddenException('Ana yöneticinin oluşturduğu etkinlikleri düzenleyemezsiniz.');
            }
            if (Number(event.createdBy) !== Number(userId) && Number(event.assignedRepresentativeId) !== Number(userId)) {
                if (!(currentUser?.isBranchRepresentative && currentUser?.branch && creator?.branch === currentUser.branch)) {
                    throw new ForbiddenException('Sadece kendi şubenize ait etkinlikleri düzenleyebilirsiniz.');
                }
            }
        }

        // Merge updates
        Object.assign(event, {
            ...updateEventDto,
            ...(updateEventDto.date && { date: new Date(updateEventDto.date) }),
        });

        // Update topics if provided
        if (updateEventDto.topics) {
            await this.topicRepository.delete({ eventId });
            for (const topic of updateEventDto.topics) {
                const eventTopic = this.topicRepository.create({ eventId, topic });
                await this.topicRepository.save(eventTopic);
            }
        }

        // Update speakers if provided
        if (updateEventDto.speakers) {
            await this.speakerRepository.delete({ eventId });
            for (const speakerName of updateEventDto.speakers) {
                const speaker = this.speakerRepository.create({ eventId, speakerName });
                await this.speakerRepository.save(speaker);
            }
        }

        return this.eventRepository.save(event);
    }

    async submitFeedback(
        eventId: number,
        userId: number,
        createFeedbackDto: CreateFeedbackDto,
    ) {
        const event = await this.findOne(eventId);

        // Check if user was registered for the event
        const registration = await this.registrationRepository.findOne({
            where: { eventId, userId },
        });

        if (!registration) {
            throw new BadRequestException('You must register for the event to leave feedback');
        }

        // Check if feedback already exists
        const existingFeedback = await this.feedbackRepository.findOne({
            where: { eventId, userId },
        });

        if (existingFeedback) {
            throw new BadRequestException('You have already submitted feedback for this event');
        }

        const feedback = this.feedbackRepository.create({
            eventId,
            userId,
            userName: createFeedbackDto.userName,
            feedback: createFeedbackDto.feedback,
            rating: createFeedbackDto.rating,
        });

        return this.feedbackRepository.save(feedback);
    }

    async getAllFeedbacks() {
        return this.feedbackRepository.find({
            relations: ['event', 'user'],
            order: { id: 'DESC' },
        });
    }

    async getEventFeedbacks(eventId: number) {
        return this.feedbackRepository.find({
            where: { eventId },
            relations: ['user'],
            order: { id: 'DESC' },
        });
    }

    // Admin Dashboard Methods

    async getStatistics() {
        const totalEvents = await this.eventRepository.count();
        const pendingPayments = await this.registrationRepository.count({
            where: { paymentStatus: PaymentStatus.PENDING } as any,
        });

        return {
            totalEvents,
            pendingPayments,
        };
    }

    async getPendingPayments() {
        return this.registrationRepository.find({
            where: { paymentStatus: PaymentStatus.PENDING } as any,
            relations: ['event', 'user'],
        });
    }

    async verifyPayment(registrationId: number, adminId: number) {
        const registration = await this.registrationRepository.findOne({
            where: { id: registrationId },
        });

        if (!registration) {
            throw new NotFoundException('Registration not found');
        }

        (registration as any).paymentStatus = PaymentStatus.VERIFIED;
        return this.registrationRepository.save(registration);
    }

    async rejectPayment(registrationId: number, adminId: number) {
        const registration = await this.registrationRepository.findOne({
            where: { id: registrationId },
        });

        if (!registration) {
            throw new NotFoundException('Registration not found');
        }

        (registration as any).paymentStatus = PaymentStatus.REJECTED;
        return this.registrationRepository.save(registration);
    }

    async checkRegistration(eventId: number, userId: number) {
        const registration = await this.registrationRepository.findOne({
            where: { eventId, userId }
        });
        return { isRegistered: !!registration };
    }

    // Event Messages (Chat)
    async getEventMessages(eventId: number) {
        const event = await this.eventRepository.findOne({ where: { id: eventId } });
        if (!event) {
            throw new NotFoundException('Event not found');
        }

        return this.messageRepository.find({
            where: { eventId },
            relations: ['user', 'replyTo', 'replyTo.user'],
            order: { createdAt: 'ASC' },
        });
    }

    async postEventMessage(
        eventId: number, 
        userId: number, 
        content: string, 
        replyToId?: number, 
        isPoll?: boolean, 
        pollOptions?: any
    ) {
        const event = await this.eventRepository.findOne({ where: { id: eventId } });
        if (!event) {
            throw new NotFoundException('Event not found');
        }

        const registration = await this.registrationRepository.findOne({
            where: { eventId, userId }
        });

        // Allow posting if user is registered OR if the user is the creator of the event/admin/assigned rep
        if (!registration && Number(event.createdBy) !== Number(userId) && Number(event.assignedRepresentativeId) !== Number(userId)) {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (user?.role !== UserRole.ADMIN) {
                 throw new ForbiddenException('You must be registered for this event to post a message.');
            }
        }

        if (content && content.startsWith('/debug')) {
            const diag = await this.testEmailLogic(eventId, userId);
            content = `DEBUG DIAGNOSIS:\n${JSON.stringify(diag, null, 2)}`;
        }

        const message = this.messageRepository.create({
            eventId,
            userId,
            content,
            replyToId: replyToId || null,
            isPoll: isPoll || false,
            pollOptions: pollOptions || null,
            pollVotes: isPoll ? {} : null
        });

        const savedMessage = await this.messageRepository.save(message);
        
        // Return with relations populated
        const populatedMessage = await this.messageRepository.findOne({
            where: { id: savedMessage.id },
            relations: ['user', 'replyTo', 'replyTo.user'],
        });

        // Async email notification logic
        this.notifyEventParticipants(eventId, userId, event.title, populatedMessage.user.name, content).catch(console.error);

        return populatedMessage;
    }

    async testEmailLogic(eventId: number, senderId: number) {
        const event = await this.eventRepository.findOne({ where: { id: eventId } });
        const sender = await this.userRepository.findOne({ where: { id: senderId } });
        
        const eventCreatedByNum = Number(event?.createdBy);
        const assignedRepNum = Number(event?.assignedRepresentativeId);
        const senderIdNum = Number(senderId);
        const isAuthorizedToNotify = (event && eventCreatedByNum === senderIdNum) || (event && assignedRepNum === senderIdNum) || (sender?.role === 'admin');
        
        if (!isAuthorizedToNotify) {
            return {
                status: 'skipped',
                reason: 'not_authorized',
                details: {
                    eventId,
                    senderId: senderIdNum,
                    eventCreatedBy: eventCreatedByNum,
                    senderRole: sender?.role,
                    isCreatorMatch: eventCreatedByNum === senderIdNum
                }
            };
        }

        const registrations = await this.registrationRepository.find({
            where: { eventId, status: In(['APPROVED', 'PENDING']) },
            relations: ['user']
        });

        const emails = new Set<string>();
        const participantsAdded = [];

        for (const reg of registrations) {
            if (Number(reg.userId) !== senderIdNum && reg.user?.email) {
                emails.add(reg.user.email);
                participantsAdded.push(reg.user.email);
            }
        }

        let creatorAdded = false;
        if (event && eventCreatedByNum !== senderIdNum) {
            const creator = await this.userRepository.findOne({ where: { id: event.createdBy } });
            if (creator?.email) {
                emails.add(creator.email);
                creatorAdded = true;
            }
        }

        let assignedRepAdded = false;
        if (event && assignedRepNum && assignedRepNum !== senderIdNum) {
            const assignedRep = await this.userRepository.findOne({ where: { id: assignedRepNum } });
            if (assignedRep?.email) {
                emails.add(assignedRep.email);
                assignedRepAdded = true;
            }
        }

        return {
            status: 'success_simulation',
            reason: 'authorized',
            details: {
                eventId,
                senderId: senderIdNum,
                eventCreatedBy: eventCreatedByNum,
                senderRole: sender?.role,
                emailsToSendCount: emails.size,
                emails: Array.from(emails),
                participantsAdded,
                creatorAdded,
                assignedRepAdded,
                totalRegistrationsChecked: registrations.length
            }
        };
    }

    private async notifyEventParticipants(eventId: number, senderId: number, eventTitle: string, senderName: string, messageContent: string) {
        console.log(`[EMAIL-DEBUG] notifyEventParticipants called. eventId=${eventId}, senderId=${senderId}, senderName=${senderName}`);
        const event = await this.eventRepository.findOne({ where: { id: eventId } });
        const sender = await this.userRepository.findOne({ where: { id: senderId } });
        
        console.log(`[EMAIL-DEBUG] event.createdBy=${event?.createdBy}, event.assignedRepresentativeId=${event?.assignedRepresentativeId}, sender.role=${sender?.role}`);
        console.log(`[EMAIL-DEBUG] createdBy match: ${Number(event?.createdBy) === Number(senderId)}, assignedRep match: ${Number(event?.assignedRepresentativeId) === Number(senderId)}, isAdmin: ${sender?.role === 'admin'}`);
        
        // Sadece etkinlik sahibi, il temsilcisi veya Admin yazarsa bildirim gitsin
        const isAuthorizedToNotify = (event && Number(event.createdBy) === Number(senderId)) || (event && Number(event.assignedRepresentativeId) === Number(senderId)) || (sender?.role === 'admin');
        console.log(`[EMAIL-DEBUG] isAuthorizedToNotify=${isAuthorizedToNotify}`);
        if (!isAuthorizedToNotify) {
            console.log(`[EMAIL-DEBUG] NOT authorized, skipping email.`);
            return; // Normal kullanıcıların mesajlarında mail atma
        }

        // Fetch all approved/pending registrations with user relation
        const registrations = await this.registrationRepository.find({
            where: { eventId, status: In(['APPROVED', 'PENDING']) },
            relations: ['user']
        });

        const emails = new Set<string>();

        // Add participants
        for (const reg of registrations) {
            if (Number(reg.userId) !== Number(senderId) && reg.user?.email) {
                emails.add(reg.user.email);
            }
        }

        // Add event creator if the sender is not the creator
        if (event && Number(event.createdBy) !== Number(senderId)) {
            const creator = await this.userRepository.findOne({ where: { id: event.createdBy } });
            if (creator?.email) {
                emails.add(creator.email);
            }
        }

        // Add assigned representative if the sender is not the assigned rep
        if (event && event.assignedRepresentativeId && Number(event.assignedRepresentativeId) !== Number(senderId)) {
            const assignedRep = await this.userRepository.findOne({ where: { id: event.assignedRepresentativeId } });
            if (assignedRep?.email) {
                emails.add(assignedRep.email);
            }
        }

        // Send email individually to avoid BCC spam filters and to prevent blocking
        const emailList = Array.from(emails);
        console.log(`[EMAIL-DEBUG] Total emails to send: ${emailList.length}, emails: ${emailList.join(', ')}`);
        for (const email of emailList) {
            console.log(`[EMAIL-DEBUG] Sending email to: ${email}`);
            try {
                await this.emailService.sendEventMessageNotification(email, eventTitle, senderName, messageContent, eventId);
                console.log(`[EMAIL-DEBUG] Email sent successfully to: ${email}`);
            } catch (err) {
                console.error(`[EMAIL-DEBUG] Email FAILED to: ${email}`, err.message);
            }
        }
        console.log(`[EMAIL-DEBUG] All emails processed.`);
    }

    async editEventMessage(messageId: number, userId: number, content: string) {
        const message = await this.messageRepository.findOne({ where: { id: messageId } });
        if (!message) throw new NotFoundException('Message not found');
        if (message.userId !== userId) throw new ForbiddenException('You can only edit your own messages');
        if (message.isDeleted) throw new ForbiddenException('Cannot edit a deleted message');
        if (message.isPoll) throw new ForbiddenException('Cannot edit a poll');

        message.content = content;
        message.isEdited = true;
        await this.messageRepository.save(message);

        return this.messageRepository.findOne({
            where: { id: messageId },
            relations: ['user', 'replyTo', 'replyTo.user'],
        });
    }

    async deleteEventMessage(messageId: number, userId: number) {
        const message = await this.messageRepository.findOne({ where: { id: messageId } });
        if (!message) throw new NotFoundException('Message not found');
        
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (message.userId !== userId && user?.role !== UserRole.ADMIN) {
            throw new ForbiddenException('You can only delete your own messages');
        }

        // Instead of hard deleting, we mark it as deleted and clear content/poll data
        message.isDeleted = true;
        message.content = 'Bu mesaj silindi';
        message.isPoll = false;
        message.pollOptions = null;
        message.pollVotes = null;

        await this.messageRepository.save(message);
        return { success: true };
    }

    async votePoll(messageId: number, userId: number, optionIds: number[]) {
        const message = await this.messageRepository.findOne({ where: { id: messageId } });
        if (!message) throw new NotFoundException('Message not found');
        if (!message.isPoll) throw new BadRequestException('This message is not a poll');
        if (message.isDeleted) throw new ForbiddenException('Cannot vote on a deleted message');

        // Allow multiple options if optionIds is an array
        const votes = message.pollVotes || {};
        votes[`user_${userId}`] = optionIds;
        message.pollVotes = votes;

        await this.messageRepository.save(message);

        return this.messageRepository.findOne({
            where: { id: messageId },
            relations: ['user', 'replyTo', 'replyTo.user'],
        });
    }
}
