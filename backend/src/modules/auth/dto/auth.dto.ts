import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Password123!' })
    @IsString()
    @MinLength(7, { message: 'Şifre 6 karakterden büyük olmalıdır' })
    password: string;

    @ApiProperty({ example: 'John' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Doe', required: false })
    @IsOptional()
    @IsString()
    surname?: string;

    @ApiProperty({ example: 'BONDLE-XYZ', required: false })
    @IsOptional()
    @IsString()
    referralCode?: string;
}

export class LoginDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Password123!' })
    @IsString()
    password: string;
}

export class GoogleAuthDto {
    @ApiProperty({ example: 'google-oauth-access-token' })
    @IsString()
    accessToken: string;

    @ApiProperty({ example: 'BONDLE-XYZ', required: false })
    @IsOptional()
    @IsString()
    referralCode?: string;
}

export class VerifyEmailDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    code: string;
}

export class ResendVerificationDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;
}

export class ForgotPasswordDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    code: string;

    @ApiProperty({ example: 'NewPassword123!' })
    @IsString()
    @MinLength(7, { message: 'Şifre 6 karakterden büyük olmalıdır' })
    newPassword: string;
}

export class CompleteOnboardingDto {
    @ApiProperty({ example: ['technology', 'ai', 'startups'] })
    @IsString({ each: true })
    interests: string[];

    @ApiProperty({ example: 'John', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ example: 'Doe', required: false })
    @IsOptional()
    @IsString()
    surname?: string;

    @ApiProperty({ example: 'Software Engineer', required: false })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({ example: 'Bio text here', required: false })
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiProperty({ example: 'İstanbul', required: false })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiProperty({ example: 'base64_string', required: false })
    @IsOptional()
    @IsString()
    profilePicture?: string;

    @ApiProperty({ example: '+905551234567', required: false })
    @IsOptional()
    @IsString()
    phone?: string;
}
