import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateAnnouncementDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    image: string;

    @IsString()
    @IsOptional()
    linkTo?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsBoolean()
    @IsOptional()
    isPinned?: boolean;

    @IsOptional()
    priority?: number;

    @IsOptional()
    clubId?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
