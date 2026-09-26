import { IsString, IsOptional } from 'class-validator';

export class CreatePremiumRequestDto {
    @IsOptional()
    @IsString()
    paymentProof?: string;

    @IsOptional()
    @IsString()
    shopierOrderId?: string;
}

export class ApprovePremiumRequestDto {
    requestId: number;
}

export class RejectPremiumRequestDto {
    requestId: number;
    reason: string;
}
