import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private resend: Resend;
    private from: string;

    constructor() {
        this.resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');
        this.from = process.env.RESEND_FROM_EMAIL || 'Bondle <onboarding@resend.dev>';
        console.log(`[EmailService] Initialized with Resend. API_KEY: ${process.env.RESEND_API_KEY ? 'SET' : 'MISSING'}, FROM: ${this.from}`);
    }

    private async sendEmail(to: string, subject: string, html: string): Promise<void> {
        try {
            const { data, error } = await this.resend.emails.send({ from: this.from, to, subject, html });
            if (error) {
                console.error('[EmailService] Resend error:', error);
            } else {
                console.log(`[EmailService] Email sent via Resend. id=${data?.id}, to=${to}`);
            }
        } catch (err) {
            console.error('[EmailService] Resend exception:', err);
        }
    }

    generateCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async sendVerificationCode(email: string, code: string): Promise<void> {
        await this.sendEmail(email, 'Bondle - E-posta Doğrulama Kodu',
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;text-align:center;"><img src="https://bondlecommunity.com/logo.png" alt="Bondle Logo" style="height:50px; margin:0 auto 20px auto; display:block;" /><div style="background:#f8f9fa;border-radius:12px;padding:30px;text-align:center;"><h2>E-posta Doğrulama</h2><div style="background:#8b5cf6;color:white;font-size:32px;font-weight:bold;letter-spacing:8px;padding:15px 30px;border-radius:8px;display:inline-block;">${code}</div><p style="color:#999;font-size:14px;margin-top:20px;">Bu kod 10 dakika içinde geçerliliğini yitirecektir.</p></div></div>`
        );
    }

    async sendPasswordResetCode(email: string, code: string): Promise<void> {
        await this.sendEmail(email, 'Bondle - Şifre Sıfırlama Kodu',
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;text-align:center;"><img src="https://bondlecommunity.com/logo.png" alt="Bondle Logo" style="height:50px; margin:0 auto 20px auto; display:block;" /><div style="background:#f8f9fa;border-radius:12px;padding:30px;text-align:center;"><h2>Şifre Sıfırlama</h2><div style="background:#f43f5e;color:white;font-size:32px;font-weight:bold;letter-spacing:8px;padding:15px 30px;border-radius:8px;display:inline-block;">${code}</div><p style="color:#999;font-size:14px;margin-top:20px;">Bu kod 10 dakika içinde geçerliliğini yitirecektir.</p></div></div>`
        );
    }

    async sendProfileViewNotification(email: string, name: string, viewCount: number): Promise<void> {
        await this.sendEmail(email, 'Bondle - Profilin dikkat cekiyor',
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h1 style="color:#8b5cf6;text-align:center;">Bondle</h1><div style="background:#f8f9fa;border-radius:12px;padding:30px;text-align:center;"><h2>Selam ${name}!</h2><p>Son gunlerde <strong>${viewCount} kisinin</strong> profiline goz atti.</p><a href="https://www.bondlecommunity.com" style="background:#8b5cf6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Kim Olduklarini Gor</a></div></div>`
        );
    }

    async sendEventMessageNotification(email: string, eventTitle: string, senderName: string, messageContent: string, eventId: number): Promise<void> {
        await this.sendEmail(email, `Yeni mesaj - ${eventTitle}`,
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h1 style="color:#8b5cf6;text-align:center;">Bondle</h1><p><strong>${eventTitle}</strong> sohbetinde <strong>${senderName}</strong> mesaj gonderdi: "${messageContent}"</p><a href="https://www.bondlecommunity.com/events/${eventId}?tab=chat" style="background:#8b5cf6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Sohbete Katil</a></div>`
        );
    }

    async sendAdminNotification(adminEmail: string, subject: string, message: string): Promise<void> {
        await this.sendEmail(adminEmail, subject,
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2>Sistem Bildirimi</h2><p>${message}</p></div>`
        );
    }

    async sendMeetingRequestEmail(email: string, recipientName: string, senderName: string, scheduledDate: string, motivation: string, notes: string): Promise<void> {
        await this.sendEmail(email, `${senderName} sizinle gorusmek istiyor!`,
            `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background-color:#fafafa;"><div style="background-color:#ffffff;border-radius:24px;padding:40px;box-shadow:0 10px 25px rgba(0,0,0,0.05);border:1px solid #f1f5f9;"><div style="text-align:center;margin-bottom:30px;"><h1 style="color:#7c3aed;font-size:28px;font-weight:800;margin:0;">Bondle</h1><p style="color:#94a3b8;font-size:14px;margin-top:4px;">Networking &amp; Topluluk Platformu</p></div><div style="text-align:center;margin-bottom:32px;"><div style="width:72px;height:72px;border-radius:22px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);display:inline-block;line-height:72px;text-align:center;font-size:32px;margin-bottom:20px;">&#x1F91D;</div><h2 style="color:#0f172a;font-size:24px;font-weight:700;margin:0 0 12px 0;">Yeni Gorusme Talebi</h2><p style="color:#475569;font-size:16px;margin:0;"><strong style="color:#7c3aed;">${senderName}</strong> sizinle bir gorusme planlamak istiyor.</p></div><div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin-bottom:32px;"><div style="margin-bottom:20px;"><div style="font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">PLANLANAN TARIH</div><div style="font-size:18px;font-weight:600;color:#0f172a;">${scheduledDate}</div></div><div style="height:1px;background-color:#e2e8f0;margin:20px 0;"></div><div><div style="font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">GORUSME MOTIVASYONU</div><div style="font-size:15px;color:#334155;line-height:1.6;font-style:italic;background-color:#ffffff;padding:16px;border-radius:12px;border:1px solid #e2e8f0;border-left:4px solid #8b5cf6;">"${motivation}"</div></div>${notes ? `<div style="height:1px;background-color:#e2e8f0;margin:20px 0;"></div><div><div style="font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">EK NOTLAR</div><div style="font-size:15px;color:#475569;line-height:1.5;background-color:#ffffff;padding:16px;border-radius:12px;border:1px solid #e2e8f0;">${notes}</div></div>` : ''}</div><div style="text-align:center;"><a href="https://www.bondlecommunity.com/network/connections?tab=requests" style="background:linear-gradient(135deg,#7c3aed,#4c1d95);color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:30px;font-weight:600;font-size:16px;display:inline-block;">Talebe Yanit Ver</a></div></div><div style="text-align:center;margin-top:32px;"><p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">Selam <strong>${recipientName}</strong>, bu e-posta size gorusme talebi gonderildigi icin iletildi.</p><p style="color:#cbd5e1;font-size:12px;margin-top:12px;">&copy; ${new Date().getFullYear()} Bondle Toplulugu</p></div></div>`
        );
    }
}
