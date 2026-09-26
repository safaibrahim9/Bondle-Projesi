import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventFeedbackDto {
    @ApiProperty({ example: 1 })
    @IsNumber()
    eventId: number;

    @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiProperty({ example: 'Great event!', required: false })
    @IsOptional()
    @IsString()
    comment?: string;
}

export class CreateGeneralFeedbackDto {
    @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiProperty({ example: 'Love the platform!', required: false })
    @IsOptional()
    @IsString()
    comment?: string;
}
