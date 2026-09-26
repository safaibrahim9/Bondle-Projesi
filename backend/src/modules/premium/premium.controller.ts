import { Controller, Get, Post, Param, UseGuards, Request, Body, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PremiumService } from './premium.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePremiumRequestDto } from './dto/premium-request.dto';

@ApiTags('Premium')
@Controller('premium')
export class PremiumController {
    constructor(private readonly premiumService: PremiumService) { }

    @Get('plans')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get available premium plans' })
    async getPlans() {
        return this.premiumService.getPlans();
    }

    @Get('my-membership')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get my active membership' })
    async getMyMembership(@CurrentUser() user: any) {
        return this.premiumService.getUserMembership(user.sub);
    }

    @Post('subscribe/:plan')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Subscribe to premium plan' })
    async subscribe(@CurrentUser() user: any, @Param('plan') plan: string) {
        return this.premiumService.createMembership(user.sub, plan);
    }

    @Post('generate-payment/:plan')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Generate Shopier payment HTML form' })
    async generatePayment(@CurrentUser() user: any, @Param('plan') plan: string) {
        return this.premiumService.generatePaymentHtml(user.sub, plan);
    }

    // Premium Request Workflow
    @Post('request')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Create a premium request (after Shopier payment)' })
    async createRequest(@CurrentUser() user: any, @Body() dto: CreatePremiumRequestDto) {
        return this.premiumService.createRequest(user.sub, dto);
    }

    @Get('my-request')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get my premium request status' })
    async getMyRequest(@CurrentUser() user: any) {
        return this.premiumService.getUserRequest(user.sub);
    }

    @Get('pending')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get all pending premium requests (admin only)' })
    async getPendingRequests(@Request() req) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can view pending requests');
        }
        return this.premiumService.getPendingRequests();
    }

    @Post('approve/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Approve a premium request (admin only)' })
    async approveRequest(@Param('id') id: string, @Request() req) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can approve requests');
        }
        return this.premiumService.approveRequest(+id, req.user.sub);
    }

    @Post('reject/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Reject a premium request (admin only)' })
    async rejectRequest(
        @Param('id') id: string,
        @Request() req,
        @Body() body: { reason: string }
    ) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can reject requests');
        }
        return this.premiumService.rejectRequest(+id, req.user.sub, body.reason);
    }

    @Post('shopier-webhook')
    @ApiOperation({ summary: 'Shopier payment webhook callback' })
    async shopierWebhook(@Body() body: any) {
        const result = await this.premiumService.handleShopierWebhook(body);
        if (result) {
            return { success: true };
        }
        throw new BadRequestException('Webhook validation failed');
    }
}
