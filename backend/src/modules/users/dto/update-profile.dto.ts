import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    surname?: string;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    profilePicture?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    interests?: string[];

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    memberCount?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    eventCount?: number;

    @IsOptional()
    @IsString()
    clubInfo?: string;

    @IsOptional()
    @IsBoolean()
    onboardingComplete?: boolean;
}
