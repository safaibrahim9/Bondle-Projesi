import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClubDto {
    @ApiProperty({ example: 'Tech İstanbul' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'İstanbul\'un en büyük teknoloji topluluğu', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 'İstanbul', required: false })
    @IsString()
    @IsOptional()
    city?: string;

    @ApiProperty({ example: ['Technology', 'AI'], required: false })
    @IsArray()
    @IsOptional()
    categories?: string[];

    @ApiProperty({ required: false })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    presidentId?: number;

    @ApiProperty({ required: false })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    memberCount?: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    instagramUrl?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    linkedinUrl?: string;
}

export class UpdateClubDto {
    @ApiProperty({ example: 'Tech İstanbul', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    city?: string;

    @ApiProperty({ required: false })
    @IsArray()
    @IsOptional()
    categories?: string[];

    @ApiProperty({ required: false })
    @Type(() => Number)
    @IsOptional()
    memberCount?: number;

    @ApiProperty({ required: false })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    presidentId?: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    instagramUrl?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    linkedinUrl?: string;
}
