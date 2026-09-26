import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmissionDto {
    @ApiProperty({ example: 'Ali' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Yılmaz' })
    @IsString()
    surname: string;

    @ApiProperty({ example: 'ali@example.com' })
    @IsString()
    email: string;

    @ApiProperty({ example: '05551234567' })
    @IsString()
    phone: string;

    @ApiProperty({ example: 'Bu yarışmaya katılmak istiyorum çünkü...' })
    @IsString()
    motivation: string;

    @ApiProperty({ example: 'İstanbul Üniversitesi', required: false })
    @IsOptional()
    @IsString()
    university?: string;

    @ApiProperty({ example: 'Bilgisayar Mühendisliği', required: false })
    @IsOptional()
    @IsString()
    department?: string;

    @ApiProperty({ example: 'Ek notlar...', required: false })
    @IsOptional()
    @IsString()
    notes?: string;
}
