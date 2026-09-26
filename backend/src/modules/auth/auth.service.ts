import {
    Injectable,
    Inject,
    forwardRef,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserInterest } from '../users/entities/user-interest.entity';
import { Credit } from '../credits/entities/credit.entity';
import { RegisterDto, LoginDto, CompleteOnboardingDto } from './dto/auth.dto';
import { PasswordUtil } from '../../common/utils/password.util';
import { ProfileIdGenerator } from '../../common/utils/profile-id.util';
import { UserRole } from '../../common/enums';
import { EmailService } from '../../common/services/email.service';
import { NotificationsService } from '../notifications/notifications.service';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const CODE_EXPIRY_MINUTES = 10;

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(UserInterest)
        private userInterestRepository: Repository<UserInterest>,
        @InjectRepository(Credit)
        private creditRepository: Repository<Credit>,
        private jwtService: JwtService,
        private emailService: EmailService,
        @Inject(forwardRef(() => NotificationsService))
        private notificationsService: NotificationsService,
    ) { }

    async register(registerDto: RegisterDto) {
        // Check if user exists
        const existingUser = await this.userRepository.findOne({
            where: { email: registerDto.email },
        });

        if (existingUser) {
            throw new ConflictException('Bu e-posta adresi zaten kayıtlı');
        }

        // Hash password
        const passwordHash = await PasswordUtil.hashPassword(registerDto.password);

        // Generate unique profile ID
        const profileId = ProfileIdGenerator.generate();

        // Handle referral logic
        let referredById: number | null = null;
        if (registerDto.referralCode) {
            const referrer = await this.userRepository.findOne({
                where: { referralCode: registerDto.referralCode.toUpperCase() }
            });
            if (referrer) {
                referredById = referrer.id;
            }
        }

        // Generate a new referral code for this user
        const newReferralCode = 'BONDLE-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        // Generate verification code
        const verificationCode = this.emailService.generateCode();
        const verificationCodeExpiry = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

        let isPremium = false;
        let premiumStatus = 'none';
        let premiumExpiresAt: Date | null = null;

        // Create user (auto-verified)
        const user = this.userRepository.create({
            email: registerDto.email,
            passwordHash,
            name: registerDto.name,
            surname: registerDto.surname,
            profileId,
            role: UserRole.USER,
            isPremium,
            premiumStatus,
            premiumExpiresAt,
            onboardingComplete: false,
            isEmailVerified: true,
            verificationCode: null,
            verificationCodeExpiry: null,
            referralCode: newReferralCode,
            referredById: referredById,
        });

        await this.userRepository.save(user);

        // Notify admin about new registration
        try {
            const targetEmail = 'ibrahimsafa1903@gmail.com';
            await this.emailService.sendAdminNotification(
                targetEmail,
                'Yeni Kullanıcı Kaydı',
                `Sisteme yeni bir kullanıcı kayıt oldu.<br>Ad: <strong>${user.name} ${user.surname || ''}</strong><br>E-posta: <strong>${user.email}</strong>`
            );

            const admin = await this.userRepository.findOne({ where: { email: targetEmail } });
            if (admin) {
                // Also send in-app notification to the admin
                await this.notificationsService.createNotification(
                    admin.id,
                    'Yeni Kullanıcı Kaydı 👤',
                    `${user.name} ${user.surname || ''} uygulamaya yeni kayıt oldu.`,
                    'NEW_USER_REGISTRATION',
                    user.id
                );
            }
        } catch (err) {
            console.error('Failed to send admin notification for new user:', err);
        }

        // Initialize credits
        await this.initializeUserCredits(user.id, UserRole.USER);

        // Auto-login after registration
        const tokens = await this.generateTokens(user);

        return {
            message: 'Kayıt başarılı!',
            ...tokens,
            user: this.sanitizeUser(user),
            requiresVerification: false,
        };
    }

    async verifyEmail(email: string, code: string) {
        const user = await this.userRepository.findOne({
            where: { email },
        });

        if (!user) {
            throw new BadRequestException('Kullanıcı bulunamadı');
        }

        if (user.isEmailVerified) {
            throw new BadRequestException('E-posta zaten doğrulanmış');
        }

        if (!user.verificationCode || user.verificationCode !== code) {
            throw new BadRequestException('Geçersiz doğrulama kodu');
        }

        if (user.verificationCodeExpiry && new Date() > user.verificationCodeExpiry) {
            throw new BadRequestException('Doğrulama kodunun süresi dolmuş. Lütfen yeni kod isteyin.');
        }

        // Verify email
        user.isEmailVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpiry = null;
        await this.userRepository.save(user);

        // Generate JWT after verification
        const tokens = await this.generateTokens(user);

        return {
            message: 'E-posta başarıyla doğrulandı!',
            ...tokens,
            user: this.sanitizeUser(user),
        };
    }

    async resendVerificationCode(email: string) {
        const user = await this.userRepository.findOne({
            where: { email },
        });

        if (!user) {
            throw new BadRequestException('Kullanıcı bulunamadı');
        }

        if (user.isEmailVerified) {
            throw new BadRequestException('E-posta zaten doğrulanmış');
        }

        // Generate new code
        const verificationCode = this.emailService.generateCode();
        user.verificationCode = verificationCode;
        user.verificationCodeExpiry = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
        await this.userRepository.save(user);

        // Send new code
        await this.emailService.sendVerificationCode(email, verificationCode);

        return {
            message: 'Yeni doğrulama kodu e-postanıza gönderildi.',
        };
    }

    async login(loginDto: LoginDto) {
        const user = await this.userRepository.findOne({
            where: { email: loginDto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Geçersiz e-posta veya şifre');
        }

        if (user.isBanned) {
            throw new UnauthorizedException('Hesabınız askıya alınmış');
        }

        // Check if account is locked
        if (user.lockUntil && new Date() < user.lockUntil) {
            const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
            throw new UnauthorizedException(
                `Hesabınız ${remainingMinutes} dakika süreyle kilitlenmiştir. Lütfen daha sonra tekrar deneyin.`
            );
        }

        // Reset lock if expired
        if (user.lockUntil && new Date() >= user.lockUntil) {
            user.failedLoginAttempts = 0;
            user.lockUntil = null;
            await this.userRepository.save(user);
        }

        if (!user.passwordHash) {
            if (user.authProvider === 'google' || user.googleId) {
                throw new UnauthorizedException('Bu hesap Google ile oluşturulmuş. Lütfen "Google ile Giriş Yap" butonunu kullanın.');
            }
            throw new UnauthorizedException('Geçersiz e-posta veya şifre');
        }

        const isPasswordValid = await PasswordUtil.comparePassword(
            loginDto.password,
            user.passwordHash,
        );

        if (!isPasswordValid) {
            // Increment failed attempts
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

            if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.lockUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
                await this.userRepository.save(user);
                throw new UnauthorizedException(
                    `Çok fazla başarısız giriş denemesi. Hesabınız ${LOCK_DURATION_MINUTES} dakika süreyle kilitlendi.`
                );
            }

            await this.userRepository.save(user);
            throw new UnauthorizedException('Geçersiz e-posta veya şifre');
        }

        // Check if email is verified (only for non-Google users)
        if (!user.isEmailVerified && user.authProvider !== 'google') {
            throw new UnauthorizedException('E-postanız henüz doğrulanmamış. Lütfen e-postanıza gelen kodu girin.');
        }

        // Reset failed attempts on successful login
        if (user.failedLoginAttempts > 0) {
            user.failedLoginAttempts = 0;
            user.lockUntil = null;
            await this.userRepository.save(user);
        }

        // --- 2FA Check for Admins ---
        if (user.role === UserRole.ADMIN) {
            const twoFactorCode = this.emailService.generateCode();
            user.twoFactorCode = twoFactorCode;
            user.twoFactorCodeExpiry = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
            await this.userRepository.save(user);

            // Send 2FA code via email
            await this.emailService.sendVerificationCode(user.email, twoFactorCode); // Reuse sendVerificationCode or create specific one

            return {
                message: 'Güvenlik adımı: E-postanıza gönderilen 2FA kodunu giriniz.',
                require2FA: true,
                email: user.email,
            };
        }

        const tokens = await this.generateTokens(user);

        return {
            ...tokens,
            user: this.sanitizeUser(user),
        };
    }

    async verifyTwoFactorCode(email: string, code: string) {
        const user = await this.userRepository.findOne({
            where: { email },
        });

        if (!user) {
            throw new BadRequestException('Kullanıcı bulunamadı');
        }

        if (!user.twoFactorCode || user.twoFactorCode !== code) {
            throw new BadRequestException('Geçersiz 2FA kodu');
        }

        if (user.twoFactorCodeExpiry && new Date() > user.twoFactorCodeExpiry) {
            throw new BadRequestException('2FA kodunun süresi dolmuş. Lütfen tekrar giriş yapın.');
        }

        // Clear code after successful verification
        user.twoFactorCode = null;
        user.twoFactorCodeExpiry = null;
        await this.userRepository.save(user);

        const tokens = await this.generateTokens(user);

        return {
            ...tokens,
            user: this.sanitizeUser(user),
        };
    }

    async forgotPassword(email: string) {
        const user = await this.userRepository.findOne({
            where: { email },
        });

        // Don't reveal if user exists - always return success
        if (!user) {
            return {
                message: 'Eğer bu e-posta adresine kayıtlı bir hesap varsa, şifre sıfırlama kodu gönderildi.',
            };
        }

        // Generate reset code
        const resetCode = this.emailService.generateCode();
        user.resetPasswordCode = resetCode;
        user.resetPasswordCodeExpiry = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
        await this.userRepository.save(user);

        // Send reset email
        await this.emailService.sendPasswordResetCode(email, resetCode);

        return {
            message: 'Eğer bu e-posta adresine kayıtlı bir hesap varsa, şifre sıfırlama kodu gönderildi.',
        };
    }

    async resetPassword(email: string, code: string, newPassword: string) {
        const user = await this.userRepository.findOne({
            where: { email },
        });

        if (!user) {
            throw new BadRequestException('Geçersiz istek');
        }

        if (!user.resetPasswordCode || user.resetPasswordCode !== code) {
            throw new BadRequestException('Geçersiz sıfırlama kodu');
        }

        if (user.resetPasswordCodeExpiry && new Date() > user.resetPasswordCodeExpiry) {
            throw new BadRequestException('Sıfırlama kodunun süresi dolmuş. Lütfen yeni kod isteyin.');
        }

        // Update password
        user.passwordHash = await PasswordUtil.hashPassword(newPassword);
        user.resetPasswordCode = null;
        user.resetPasswordCodeExpiry = null;
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await this.userRepository.save(user);

        return {
            message: 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.',
        };
    }

    async changePassword(userId: number, oldPassword: string, newPassword: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new BadRequestException('Kullanıcı bulunamadı');
        }

        // Check if user is a social login user (no password set)
        if (user.authProvider === 'google' || user.googleId || !user.passwordHash) {
            throw new BadRequestException('Google ile giriş yapan kullanıcılar şifre değiştiremez. Lütfen Google hesap ayarlarınızı kontrol edin.');
        }

        const isPasswordValid = await PasswordUtil.comparePassword(oldPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new BadRequestException('Mevcut şifre hatalı');
        }

        user.passwordHash = await PasswordUtil.hashPassword(newPassword);
        await this.userRepository.save(user);

        return { message: 'Şifreniz başarıyla değiştirildi.' };
    }

    async loginWithGoogle(accessToken: string, referralCode?: string) {
        try {
            // Fetch user info from Google using access token with timeout
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

            let response: Response;
            try {
                response = await fetch(
                    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`,
                    { signal: controller.signal }
                );
            } finally {
                clearTimeout(timeout);
            }

            if (!response.ok) {
                const errText = await response.text().catch(() => 'unknown');
                console.error(`[AuthService] Google userinfo failed: ${response.status} - ${errText}`);
                throw new UnauthorizedException('Geçersiz Google token. Lütfen tekrar deneyin.');
            }

            const googleUser = await response.json();

            if (!googleUser.sub || !googleUser.email) {
                throw new UnauthorizedException('Google hesabından kullanıcı bilgileri alınamadı.');
            }

            // Check if user exists
            let user = await this.userRepository.findOne({
                where: { googleId: googleUser.sub },
            });

            let isNewUser = false;

            if (!user) {
                // Check if email already exists (maybe registered with password)
                const existingEmailUser = await this.userRepository.findOne({
                    where: { email: googleUser.email },
                });

                if (existingEmailUser) {
                    // Link Google account to existing user
                    existingEmailUser.googleId = googleUser.sub;
                    existingEmailUser.profilePicture = googleUser.picture;
                    existingEmailUser.isEmailVerified = true; // Google verifies email
                    existingEmailUser.authProvider = 'google';
                    user = await this.userRepository.save(existingEmailUser);
                } else {
                    // Create new user
                    const profileId = ProfileIdGenerator.generate();

                    // Handle referral if provided
                    let referredById: number | null = null;
                    if (referralCode) {
                        const referrer = await this.userRepository.findOne({ where: { referralCode } });
                        if (referrer) {
                            referredById = referrer.id;
                        }
                    }

                    let isPremium = false;
                    let premiumStatus = 'none';
                    let premiumExpiresAt: Date | null = null;

                    user = this.userRepository.create({
                        googleId: googleUser.sub,
                        email: googleUser.email,
                        name: googleUser.given_name,
                        surname: googleUser.family_name || '',
                        profilePicture: googleUser.picture,
                        profileId,
                        role: UserRole.USER,
                        isPremium,
                        premiumStatus,
                        premiumExpiresAt,
                        onboardingComplete: false,
                        isEmailVerified: true, // Google accounts are pre-verified
                        authProvider: 'google',
                        referredById
                    });

                    await this.userRepository.save(user);

                    // Notify admin about new Google registration
                    try {
                        const targetEmail = 'ibrahimsafa1903@gmail.com';
                        await this.emailService.sendAdminNotification(
                            targetEmail,
                            'Yeni Kullanıcı Kaydı (Google)',
                            `Sisteme Google ile yeni bir kullanıcı kayıt oldu.<br>Ad: <strong>${user.name} ${user.surname || ''}</strong><br>E-posta: <strong>${user.email}</strong>`
                        );
                        
                        const admin = await this.userRepository.findOne({ where: { email: targetEmail } });
                        if (admin) {
                            // Also send in-app notification to the admin
                            await this.notificationsService.createNotification(
                                admin.id,
                                'Yeni Kullanıcı Kaydı (Google) 👤',
                                `${user.name} ${user.surname || ''} uygulamaya Google hesabı ile kayıt oldu.`,
                                'NEW_USER_REGISTRATION',
                                user.id
                            );
                        }
                    } catch (err) {
                        console.error('Failed to send admin notification for new Google user:', err);
                    }

                    // Initialize credits for new user
                    await this.initializeUserCredits(user.id, UserRole.USER);

                    isNewUser = true;
                }
            }

            if (user.isBanned) {
                throw new UnauthorizedException('Hesabınız askıya alınmış.');
            }

            const tokens = await this.generateTokens(user);

            return {
                ...tokens,
                user: this.sanitizeUser(user),
                isNewUser,
            };
        } catch (error) {
            console.error('[AuthService] Google login error:', error?.message || error);
            if (error instanceof UnauthorizedException) throw error;
            if (error?.name === 'AbortError') {
                throw new UnauthorizedException('Google kimlik doğrulama isteği zaman aşımına uğradı. Lütfen tekrar deneyin.');
            }
            throw new UnauthorizedException('Google ile giriş başarısız oldu. Lütfen tekrar deneyin.');
        }
    }

    async completeOnboarding(userId: number, dto: CompleteOnboardingDto) {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Update user profile — never accept role from the client
        if (dto.name) user.name = dto.name;
        if (dto.surname) user.surname = dto.surname;
        user.title = dto.title;
        user.bio = dto.bio;
        user.city = dto.city || 'İstanbul';
        if (dto.profilePicture) user.profilePicture = dto.profilePicture;
        if (dto.phone) user.phone = dto.phone;
        user.onboardingComplete = true;

        await this.userRepository.save(user);

        // Clear existing interests first (idempotency)
        await this.userInterestRepository.delete({ userId: user.id });

        // Save interests
        if (dto.interests && dto.interests.length > 0) {
            const interestEntities = dto.interests.map(interest => 
                this.userInterestRepository.create({
                    userId: user.id,
                    interestCategory: interest,
                })
            );
            await this.userInterestRepository.save(interestEntities);
        }

        // Update credits based on role
        await this.updateCreditsForRole(user.id, user.role);

        // Re-fetch user with interests to return complete data
        const updatedUser = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['interests'],
        });

        const tokens = await this.generateTokens(updatedUser);
        const { passwordHash, verificationCode, verificationCodeExpiry, resetPasswordCode, resetPasswordCodeExpiry, refreshToken, ...sanitized } = updatedUser;

        return {
            ...tokens,
            user: {
                ...sanitized,
                interests: updatedUser.interests ? updatedUser.interests.map(i => i.interestCategory) : [],
            },
        };
    }

    async validateUser(userId: number) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['interests'],
        });
        if (!user || user.isBanned) {
            return null;
        }
        const { passwordHash, verificationCode, resetPasswordCode, refreshToken, ...sanitized } = user;
        return {
            ...sanitized,
            interests: user.interests ? user.interests.map(i => i.interestCategory) : [],
        };
    }

    private async generateTokens(user: User) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            isPremium: user.isPremium,
            isBranchRepresentative: user.isBranchRepresentative || false,
        };
        
        const access_token = this.jwtService.sign(payload, { expiresIn: '1h' });
        const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });
        
        user.refreshToken = refresh_token;
        await this.userRepository.save(user);

        return { access_token, refresh_token };
    }

    async refreshTokens(refreshToken: string) {
        try {
            // Verify token mathematically
            const payload = this.jwtService.verify(refreshToken);
            
            // Verify it exists in DB
            const user = await this.userRepository.findOne({ where: { id: payload.sub } });
            if (!user || user.refreshToken !== refreshToken || user.isBanned) {
                throw new UnauthorizedException('Geçersiz veya süresi dolmuş yenileme bileti');
            }

            // Generate new tokens
            return await this.generateTokens(user);
        } catch (e) {
            throw new UnauthorizedException('Geçersiz veya süresi dolmuş yenileme bileti');
        }
    }

    private sanitizeUser(user: User) {
        const { passwordHash, verificationCode, verificationCodeExpiry, resetPasswordCode, resetPasswordCodeExpiry, refreshToken, ...sanitized } = user;
        return sanitized;
    }

    private async initializeUserCredits(userId: number, role: UserRole) {
        const creditAmount = this.getCreditsForRole(role);
        const credit = this.creditRepository.create({
            userId,
            totalCredits: creditAmount,
            availableCredits: creditAmount,
            usedCredits: 0,
            lastResetDate: new Date(),
        });
        await this.creditRepository.save(credit);
    }

    private async updateCreditsForRole(userId: number, role: UserRole) {
        const creditAmount = this.getCreditsForRole(role);
        await this.creditRepository.update(
            { userId },
            {
                totalCredits: creditAmount,
                availableCredits: creditAmount,
            },
        );
    }

    private getCreditsForRole(role: UserRole): number {
        switch (role) {
            case UserRole.ADMIN:
                return 9999;
            case UserRole.PREMIUM_USER:
                return 20;
            case UserRole.CLUB_PRESIDENT:
                return 10;
            case UserRole.USER:
            default:
                return 5;
        }
    }

    async loginWithDevUser(email: string, name: string, role: string) {
        // Check if user exists
        let user = await this.userRepository.findOne({
            where: { email },
        });

        if (!user) {
            // Create new dev user
            const profileId = ProfileIdGenerator.generate();
            user = this.userRepository.create({
                email,
                name,
                passwordHash: '', // No password for dev users
                profileId,
                role: UserRole.USER,
                isPremium: false,
                onboardingComplete: true, // Auto-complete onboarding for dev users
                authProvider: 'dev',
                isEmailVerified: true, // Dev users are pre-verified
            });

            await this.userRepository.save(user);
            await this.initializeUserCredits(user.id, user.role);
        }

        // Generate JWT
        const tokens = await this.generateTokens(user);

        return {
            ...tokens,
            user: this.sanitizeUser(user),
            isNewUser: false,
        };
    }
}
