import { IsNotEmpty, IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeedbackDto {
    @ApiProperty({ example: 'Ali Yılmaz' })
    @IsString()
    @IsNotEmpty()
    userName: string;

    @ApiProperty({ example: 'Harika bir etkinlikti, teşekkürler!' })
    @IsString()
    @IsNotEmpty()
    feedback: string;

    @ApiProperty({ example: 5, minimum: 1, maximum: 5, required: false })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    rating?: number;
}
