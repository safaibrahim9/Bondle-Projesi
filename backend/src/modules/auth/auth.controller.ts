import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
    RegisterDto,
    LoginDto,
    GoogleAuthDto,
    CompleteOnboardingDto,
    VerifyEmailDto,
    ResendVerificationDto,
    ForgotPasswordDto,
    ResetPasswordDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @ApiOperation({ summary: 'Register new user' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('verify-email')
    @ApiOperation({ summary: 'Verify email with 6-digit code' })
    async verifyEmail(@Body() dto: VerifyEmailDto) {
        return this.authService.verifyEmail(dto.email, dto.code);
    }

    @Post('resend-verification')
    @ApiOperation({ summary: 'Resend email verification code' })
    async resendVerification(@Body() dto: ResendVerificationDto) {
        return this.authService.resendVerificationCode(dto.email);
    }

    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @ApiOperation({ summary: 'Login with email and password' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('verify-2fa')
    @ApiOperation({ summary: 'Verify 2FA code for admin login' })
    async verify2FA(@Body() dto: { email: string; code: string }) {
        return this.authService.verifyTwoFactorCode(dto.email, dto.code);
    }

    @Post('google')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @ApiOperation({ summary: 'Login with Google OAuth' })
    async googleAuth(@Body() googleAuthDto: GoogleAuthDto) {
        return this.authService.loginWithGoogle(googleAuthDto.accessToken, googleAuthDto.referralCode);
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Refresh access token using refresh token' })
    async refreshTokens(@Body() body: { refreshToken: string }) {
        if (!body.refreshToken) {
            throw new Error('Refresh token is required');
        }
        return this.authService.refreshTokens(body.refreshToken);
    }

    @Post('forgot-password')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @ApiOperation({ summary: 'Request password reset code' })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password with code' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
    }

    @Post('dev-login')
    @ApiOperation({ summary: 'Login with Dev User (Demo) - Development only' })
    async devLogin(@Body() body: { email: string; name: string; role: string }) {
        if (process.env.NODE_ENV !== 'development') {
            throw new Error('Dev login is disabled');
        }
        return this.authService.loginWithDevUser(body.email, body.name, UserRole.USER);
    }

    @Post('onboarding')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Complete user onboarding' })
    async completeOnboarding(
        @CurrentUser() user: any,
        @Body() dto: CompleteOnboardingDto,
    ) {
        return this.authService.completeOnboarding(user.sub, dto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get current user info' })
    async getCurrentUser(@CurrentUser() user: any) {
        return this.authService.validateUser(user.sub);
    }
    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Change current user password' })
    async changePassword(
        @CurrentUser() user: any,
        @Body() body: any,
    ) {
        return this.authService.changePassword(user.sub, body.oldPassword, body.newPassword);
    }
}
