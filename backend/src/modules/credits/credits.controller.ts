import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreditsService } from './credits.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Credits')
@Controller('credits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CreditsController {
    constructor(private readonly creditsService: CreditsService) { }

    @Get()
    @ApiOperation({ summary: 'Get current user credits' })
    async getCredits(@CurrentUser() user: any) {
        return this.creditsService.getUserCredits(user.sub);
    }

    @Get('history')
    @ApiOperation({ summary: 'Get credit transaction history' })
    async getHistory(@CurrentUser() user: any) {
        return this.creditsService.getCreditHistory(user.sub);
    }
}
