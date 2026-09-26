import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventType, PaymentType } from '../../../common/enums';

export class CreateEventDto {
    @ApiProperty({ example: 'AI & Future Tech Summit' })
    @IsString()
    title: string;

    @ApiProperty({ example: 'Learn about AI trends and future' })
    @IsString()
    description: string;

    @ApiProperty({ example: 'standard', enum: ['standard', 'circle'] })
    @IsEnum(EventType)
    eventType: EventType;

    @ApiProperty({ example: 'free', enum: ['free', 'paid'] })
    @IsEnum(PaymentType)
    paymentType: PaymentType;

    @ApiProperty({ example: 299, required: false })
    @IsOptional()
    @IsNumber()
    price?: number;

    @ApiProperty({ example: 199, required: false })
    @IsOptional()
    @IsNumber()
    premiumPrice?: number;

    @ApiProperty({ example: '2026-02-15T19:00:00Z' })
    @IsString()
    date: string;

    @ApiProperty({ example: 'İstanbul - Kadıköy', required: false })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiProperty({ example: 'İstanbul', required: false })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiProperty({ example: false })
    @IsBoolean()
    isOnline: boolean;

    @ApiProperty({ example: 'https://zoom.us/j/123456', required: false })
    @IsOptional()
    @IsString()
    zoomLink?: string;

    @ApiProperty({ example: 'https://images.unsplash.com/photo-123', required: false })
    @IsOptional()
    @IsString()
    posterImage?: string;

    @ApiProperty({ example: 100 })
    @IsNumber()
    participantLimit: number;

    @ApiProperty({ example: 'https://shopier.com/123456', required: false })
    @IsOptional()
    @IsString()
    shopierUrl?: string;

    @ApiProperty({ example: 'https://shopier.com/premium123', required: false })
    @IsOptional()
    @IsString()
    premiumShopierUrl?: string;

    @ApiProperty({ example: ['AI', 'Technology', 'Future'] })
    @IsString({ each: true })
    topics: string[];

    @ApiProperty({ example: ['Dr. John Doe', 'Jane Smith'], required: false })
    @IsOptional()
    @IsString({ each: true })
    speakers?: string[];

    @ApiProperty({ example: 1, required: false })
    @IsOptional()
    @IsNumber()
    clubId?: number;

    @ApiProperty({ example: false })
    @IsBoolean()
    @IsOptional()
    requiresForm?: boolean;

    @ApiProperty({ example: 1, required: false })
    @IsOptional()
    @IsNumber()
    assignedRepresentativeId?: number;
}
