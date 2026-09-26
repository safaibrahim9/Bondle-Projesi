import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PremiumMembership } from './entities/premium-membership.entity';
import { PremiumRequest } from './entities/premium-request.entity';
import { User } from '../users/entities/user.entity';
import { CreatePremiumRequestDto } from './dto/premium-request.dto';
import { CreditsService } from '../credits/credits.service';
import { TransactionType } from '../../common/enums';
import { ConfigService } from '@nestjs/config';
import { Shopier } from 'shopier-api';

@Injectable()
export class PremiumService {
    constructor(
        @InjectRepository(PremiumMembership)
        private membershipRepository: Repository<PremiumMembership>,
        @InjectRepository(PremiumRequest)
        private requestRepository: Repository<PremiumRequest>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private readonly creditsService: CreditsService,
        private configService: ConfigService,
    ) { }

    async getPlans() {
        return [
            {
                id: 'monthly',
                name: 'Aylık Premium',
                price: 99,
                features: [
                    'Sınırsız network',
                    'Premium etkinlikler',
                    'Öncelikli destek',
                    'Analitik dashboard',
                ],
            },
            {
                id: 'annual',
                name: 'Yıllık Premium',
                price: 999,
                features: [
                    'Tüm aylık özellikler',
                    '%15 indirim',
                    'Özel mentor eşleşmesi',
                    'VIP etkinlik erişimi',
                ],
            },
        ];
    }

    async getUserMembership(userId: number) {
        return this.membershipRepository.findOne({
            where: { userId, status: 'active' },
        });
    }

    async createMembership(userId: number, plan: string) {
        const startDate = new Date();
        const endDate = new Date();

        if (plan === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        const membership = this.membershipRepository.create({
            userId,
            plan,
            status: 'active',
            startDate,
            endDate,
            price: plan === 'monthly' ? 99 : 999,
        });

        return this.membershipRepository.save(membership);
    }

    async generatePaymentHtml(userId: number, plan: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

        const amount = plan === 'monthly' ? 99.99 : 499.00;
        const productName = plan === 'monthly' ? 'Universe Premium (Aylık)' : 'Universe Kulüp Premium (Aylık)';
        
        const apiKey = this.configService.get<string>('SHOPIER_API_KEY');
        const apiSecret = this.configService.get<string>('SHOPIER_API_SECRET');

        if (!apiKey || !apiSecret) {
            throw new BadRequestException('Ödeme sistemi şu anda yapılandırılmamış (API Key eksik). Lütfen daha sonra tekrar deneyin.');
        }

        const shopier = new Shopier(apiKey, apiSecret);
        
        const platformOrderId = `${user.id}_${plan}_${Date.now()}`;

        shopier.setBuyer({
            buyer_id_nr: user.id.toString(),
            platform_order_id: platformOrderId,
            product_name: productName,
            buyer_name: user.name || 'Universe',
            buyer_surname: user.surname || 'Kullanıcısı',
            buyer_email: user.email,
            buyer_phone: '05555555555'
        });

        shopier.setOrderBilling({
            billing_address: 'Kullanıcı Adresi',
            billing_city: 'Istanbul',
            billing_country: 'Turkey',
            billing_postcode: '34000',
        });

        shopier.setOrderShipping({
            shipping_address: 'Kullanıcı Adresi',
            shipping_city: 'Istanbul',
            shipping_country: 'Turkey',
            shipping_postcode: '34000',
        });

        const html = shopier.generatePaymentHTML(amount);
        return { html };
    }

    async handleShopierWebhook(body: any) {
        const apiKey = this.configService.get<string>('SHOPIER_API_KEY');
        const apiSecret = this.configService.get<string>('SHOPIER_API_SECRET');

        if (!apiKey || !apiSecret) {
            console.error('Webhook failed: Shopier API keys are missing in environment variables.');
            return false;
        }

        const shopier = new Shopier(apiKey, apiSecret);

        try {
            const result = shopier.callback(body);
            if (result && typeof result === 'object' && result.order_id) {
                // order_id is platform_order_id e.g. "1_monthly_1710000000"
                const parts = result.order_id.split('_');
                const userId = parseInt(parts[0], 10);
                const plan = parts[1];

                if (!userId || isNaN(userId)) {
                    console.error('Webhook: Invalid User ID in order_id:', result.order_id);
                    return false;
                }

                // Activate premium
                await this.activatePremium(userId, plan);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Webhook validation failed:', error.message);
            return false;
        }
    }

    async activatePremium(userId: number, plan: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) return;

        user.isPremium = true;
        user.premiumStatus = 'active';
        await this.userRepository.save(user);

        // Check if a membership already exists and extend it, or create a new one
        const existingMembership = await this.getUserMembership(userId);
        
        let startDate = new Date();
        let endDate = new Date();
        
        if (existingMembership && existingMembership.endDate > new Date()) {
             // Extend from current end date
             startDate = existingMembership.endDate;
             endDate = new Date(existingMembership.endDate);
        }

        endDate.setMonth(endDate.getMonth() + 1); // Add 1 month

        const membership = this.membershipRepository.create({
            userId,
            plan,
            status: 'active',
            startDate,
            endDate,
            price: plan === 'monthly' ? 149.99 : 499.00,
        });

        await this.membershipRepository.save(membership);

        // Add 20 credits reward
        await this.creditsService.addCredits(
            user.id,
            20,
            TransactionType.PREMIUM_REWARD,
            'Premium Üyelik Ödülü'
        );
    }


    // Premium Request Workflow
    async createRequest(userId: number, dto: CreatePremiumRequestDto) {
        // Check if user already has a pending request
        const existingRequest = await this.requestRepository.findOne({
            where: { userId, status: 'pending' },
        });

        if (existingRequest) {
            throw new BadRequestException('You already have a pending premium request');
        }

        // Check if user is already premium
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (user?.isPremium) {
            throw new BadRequestException('You are already a premium member');
        }

        const request = this.requestRepository.create({
            userId,
            paymentProof: dto.paymentProof,
            shopierOrderId: dto.shopierOrderId,
            status: 'pending',
        });

        return this.requestRepository.save(request);
    }

    async getUserRequest(userId: number) {
        return this.requestRepository.findOne({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async getPendingRequests() {
        return this.requestRepository.find({
            where: { status: 'pending' },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    async approveRequest(requestId: number, adminId: number) {
        const request = await this.requestRepository.findOne({
            where: { id: requestId },
            relations: ['user'],
        });

        if (!request) {
            throw new NotFoundException('Request not found');
        }

        if (request.status !== 'pending') {
            throw new BadRequestException('Request has already been processed');
        }

        // Update user to premium
        const user = await this.userRepository.findOne({ where: { id: request.userId } });
        if (user) {
            user.isPremium = true;
            user.premiumStatus = 'active';
            await this.userRepository.save(user);

            // Give +20 credits as reward for becoming premium
            await this.creditsService.addCredits(
                user.id,
                20,
                TransactionType.PREMIUM_REWARD,
                'Premium Üyelik Ödülü'
            );
        }

        // Update request status
        request.status = 'approved';
        request.processedAt = new Date();
        request.processedBy = adminId;
        await this.requestRepository.save(request);

        // Create membership (optional - for tracking)
        await this.createMembership(request.userId, 'annual');

        return { success: true, message: 'Premium request approved', user };
    }

    async rejectRequest(requestId: number, adminId: number, reason: string) {
        const request = await this.requestRepository.findOne({
            where: { id: requestId },
        });

        if (!request) {
            throw new NotFoundException('Request not found');
        }

        if (request.status !== 'pending') {
            throw new BadRequestException('Request has already been processed');
        }

        request.status = 'rejected';
        request.processedAt = new Date();
        request.processedBy = adminId;
        request.rejectionReason = reason;
        await this.requestRepository.save(request);

        return { success: true, message: 'Premium request rejected', reason };
    }
}
