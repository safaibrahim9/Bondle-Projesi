import { Controller, Get, Post, Param, UseGuards, Request, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EngagementService } from './engagement.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Engagement')
@Controller('engagement')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class EngagementController {
    constructor(private readonly engagementService: EngagementService) { }

    /** Call on login / app open to update streak and get summary */
    @Post('daily-login')
    @ApiOperation({ summary: 'Record daily login, update streak & award credits' })
    async dailyLogin(@Request() req) {
        return this.engagementService.recordDailyLogin(req.user.sub);
    }

    /** Full engagement summary: streak + badges + weekly challenges */
    @Get('summary')
    @ApiOperation({ summary: 'Get engagement summary (streak, badges, challenges)' })
    async getSummary(@Request() req) {
        return this.engagementService.getEngagementSummary(req.user.sub);
    }

    @Get('daily-goals')
    @ApiOperation({ summary: 'Get daily goals status' })
    async getDailyGoals(@Request() req) {
        return this.engagementService.getDailyGoals(req.user.sub);
    }

    @Post('daily-goals/:key/complete')
    @ApiOperation({ summary: 'Complete a daily goal' })
    async completeDailyGoal(@Request() req, @Param('key') key: string) {
        return this.engagementService.completeDailyGoal(req.user.sub, key);
    }

    @Get('streak')
    @ApiOperation({ summary: 'Get user streak info' })
    async getStreak(@Request() req) {
        return this.engagementService.getStreak(req.user.sub);
    }

    @Get('badges')
    @ApiOperation({ summary: 'Get all badges with earned status' })
    async getBadges(@Request() req) {
        return this.engagementService.getBadgeStatus(req.user.sub);
    }

    @Post('badges/seen')
    @ApiOperation({ summary: 'Mark all new badges as seen' })
    async markBadgesSeen(@Request() req) {
        await this.engagementService.markBadgesSeen(req.user.sub);
        return { success: true };
    }

    @Get('challenges')
    @ApiOperation({ summary: 'Get weekly challenges with completion status' })
    async getChallenges(@Request() req) {
        return this.engagementService.getWeeklyChallenges(req.user.sub);
    }

    @Get('smart-recommendations')
    @ApiOperation({ summary: 'Get AI powered personalized recommendations' })
    async getSmartRecommendations(@Request() req) {
        return this.engagementService.getSmartRecommendations(req.user.sub);
    }

    @Get('leaderboard')
    @ApiOperation({ summary: 'Get leaderboard' })
    async getLeaderboard(@Request() req, @Query('limit') limitRaw?: string) {
        try {
            // Safely parse limit
            let limit = 20;
            if (limitRaw) {
                const parsed = parseInt(limitRaw, 10);
                if (!isNaN(parsed) && parsed > 0) {
                    limit = parsed;
                }
            }

            // Track daily goal
            await this.engagementService.completeDailyGoal(req.user.sub, 'view_leaderboard');
            return await this.engagementService.getRanking(req.user.sub, limit);
        } catch (error) {
            console.error('[getLeaderboard] CRITICAL ERROR:', error.message);
            console.error(error.stack);
            throw new HttpException('Liderlik tablosu yüklenirken bir hata oluştu: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('use-referral')
    @ApiOperation({ summary: 'Use a referral code from a friend' })
    async useReferral(@Request() req, @Body('code') code: string) {
        return this.engagementService.useReferralCode(req.user.sub, code);
    }

    @Post('daily-answers')
    @ApiOperation({ summary: 'Submit an answer to the daily question' })
    async submitDailyAnswer(@Request() req, @Body() body: { question: string, answer: string }) {
        if (!body.question || !body.answer) {
            throw new HttpException('Soru ve cevap zorunludur.', HttpStatus.BAD_REQUEST);
        }
        return this.engagementService.submitDailyAnswer(req.user.sub, body.question, body.answer);
    }

    @Get('daily-answers')
    @ApiOperation({ summary: 'Get recent daily answers (Admin view)' })
    async getDailyAnswers() {
        return this.engagementService.getDailyAnswers();
    }

    @Post('daily-answers/:id/winner')
    @ApiOperation({ summary: 'Set an answer as a winner (Admin)' })
    async setDailyAnswerWinner(@Param('id') id: string, @Body('rank') rank: number) {
        return this.engagementService.setDailyAnswerWinner(parseInt(id, 10), rank);
    }

    @Get('daily-answers/winners')
    @ApiOperation({ summary: 'Get today\'s winners' })
    async getDailyWinners() {
        return this.engagementService.getDailyWinners();
    }

    @Post('daily-answers/announce')
    @ApiOperation({ summary: 'Announce daily winners to all participants (Admin)' })
    async announceDailyWinners() {
        return this.engagementService.announceDailyWinners();
    }
}
