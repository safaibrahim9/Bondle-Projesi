import { Controller, Post, Body, UseGuards, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('AI Career Coach')
@Controller('ai/career')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('cv-analyze')
    @ApiOperation({ summary: 'Analyze CV text and provide feedback' })
    async analyzeCV(@Body('cvText') cvText: string) {
        if (!cvText) throw new BadRequestException('CV metni zorunludur');
        return this.processCVAi(cvText);
    }

    @Post('cv-analyze-pdf')
    @ApiOperation({ summary: 'Analyze CV PDF and provide feedback' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async analyzeCVPdf(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('PDF dosyası bulunamadı');
        }
        try {
            const pdfParse = require('pdf-parse');
            const data = await pdfParse(file.buffer);
            if (!data.text || data.text.trim().length === 0) {
                throw new BadRequestException('PDF dosyasından metin okunamadı');
            }
            return this.processCVAi(data.text);
        } catch (error) {
            throw new BadRequestException('PDF okuma hatası: ' + error.message);
        }
    }

    private async processCVAi(cvText: string) {
        const prompt = `
Sen profesyonel bir İnsan Kaynakları (İK) uzmanı ve Kariyer Koçusun.
Sana bir adayın CV (Özgeçmiş) bilgilerini veya yeteneklerini vereceğim. 
Lütfen bu CV'yi incele ve aşağıdaki formatta (Markdown kullanarak) yapıcı bir değerlendirme sun:

1. **Güçlü Yönler:** Adayın hangi konularda iyi olduğunu vurgula.
2. **Gelişim Alanları / Eksikler:** Hangi yeteneklerin veya ifadelerin zayıf kaldığını belirt.
3. **Genel Tavsiye:** İşe alım şansını artırması için ne yapması gerektiğini kısa ve motive edici bir dille anlat.

İşte adayın CV / Profil metni:
"""
${cvText}
"""
Lütfen sadece Türkçe ve profesyonel/motive edici bir dille cevap ver.`;

        try {
            const response = await this.aiService.generateResponse(prompt);
            return { success: true, feedback: response };
        } catch (error) {
            console.error('[AI Career] CV analysis failed:', error.message);
            return { success: false, feedback: '⚠️ AI servisi şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.\n\nBu özellik yapay zeka destekli çalışmaktadır ve şu an servis geçici olarak erişilemiyor olabilir.' };
        }
    }


    @Post('interview-start')
    @ApiOperation({ summary: 'Start a mock interview for a given position' })
    async startInterview(@Body('position') position: string) {
        if (!position) throw new BadRequestException('Pozisyon zorunludur');

        const prompt = `
Sen bir teknoloji veya kurumsal şirketinde kıdemli İnsan Kaynakları Uzmanısın.
Karşında "${position}" pozisyonu için başvuran bir aday var. 
Mülakata başlıyorsun. Lütfen adaya bu pozisyonla ilgili profesyonel ve teknik (veya durumsal) İLK mülakat sorusunu sor.

Sadece 1 adet soru sor ve başka hiçbir şey ekleme (merhaba, nasılsınız vs. diyebilirsin ama uzatma). Adayın cevabını bekleyeceğini unutma.`;

        try {
            const response = await this.aiService.generateResponse(prompt);
            return { success: true, question: response };
        } catch (error) {
            console.error('[AI Career] Interview start failed:', error.message);
            return { success: false, question: '⚠️ AI mülakat servisi şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.' };
        }
    }

    @Post('interview-answer')
    @ApiOperation({ summary: 'Evaluate interview answer and generate next question' })
    async answerInterview(
        @Body('position') position: string,
        @Body('question') question: string,
        @Body('answer') answer: string
    ) {
        if (!position || !question || !answer) {
            throw new BadRequestException('Pozisyon, soru ve cevap zorunludur');
        }

        const prompt = `
Sen bir teknoloji veya kurumsal şirketinde kıdemli İnsan Kaynakları Uzmanısın.
"${position}" pozisyonu için mülakat yapıyorsun.

Adaya sorduğun soru: "${question}"
Adayın verdiği cevap: "${answer}"

Lütfen şu iki şeyi yap:
1. Adayın cevabını İK perspektifiyle profesyonelce, kısa ve yapıcı şekilde değerlendir (Eksikleri varsa nazikçe belirt).
2. Sonra, mülakatı devam ettirmek için bu pozisyonla ilgili yeni, farklı bir (teknik veya davranışsal) soru sor.

Cevabın şu formatta olsun:

**Değerlendirme:** (Cevabın değerlendirmesi)

**Sıradaki Soru:** (Yeni sorunun)
`;

        try {
            const response = await this.aiService.generateResponse(prompt);
            return { success: true, feedbackAndNextQuestion: response };
        } catch (error) {
            console.error('[AI Career] Interview answer failed:', error.message);
            return { success: false, feedbackAndNextQuestion: '⚠️ AI servisi şu an yanıt veremiyor. Lütfen daha sonra tekrar deneyin.' };
        }
    }

    @Post('interview-end')
    @ApiOperation({ summary: 'End the interview and evaluate the overall performance' })
    async endInterview(
        @Body('position') position: string,
        @Body('chatHistory') chatHistory: any[]
    ) {
        if (!position || !chatHistory) {
            throw new BadRequestException('Pozisyon ve sohbet geçmişi zorunludur');
        }

        const historyText = chatHistory.map(m => `${m.role === 'ai' ? 'İK Uzmanı' : 'Aday'}: ${m.content}`).join('\\n\\n');

        const prompt = `
Sen bir teknoloji veya kurumsal şirketinde kıdemli İnsan Kaynakları Uzmanısın.
"${position}" pozisyonu için mülakatı az önce bitirdin.

İşte mülakatın tam geçmişi:
"""
${historyText}
"""

Lütfen tüm mülakatı genel olarak değerlendir ve adayın performansını profesyonel, yapıcı bir dille özetle.
Şu formatı kullan (Markdown formatında):

**Genel Değerlendirme:** (Adayın genel performansı)
**Güçlü Yanları:** (Neleri iyi yaptı?)
**Geliştirmesi Gerekenler:** (Nelerde eksik kaldı?)
**Tavsiyeler:** (Neleri geliştirmeli?)
`;

        try {
            const response = await this.aiService.generateResponse(prompt);
            return { success: true, feedback: response };
        } catch (error) {
            console.error('[AI Career] Interview end failed:', error.message);
            return { success: false, feedback: '⚠️ AI değerlendirme servisi şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.' };
        }
    }
}
