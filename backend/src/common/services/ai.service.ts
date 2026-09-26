import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
    private genAI: GoogleGenerativeAI;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        const fallbackKey = this.configService.get<string>('FALLBACK_AI_KEY');
        const fallbackProvider = this.configService.get<string>('FALLBACK_AI_PROVIDER');

        console.log(`🤖 AI Service: Gemini ${apiKey ? '✅' : '❌'}, Fallback (${fallbackProvider}) ${fallbackKey ? '✅' : '❌'}`);

        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
    }

    async generateResponse(prompt: string, options: { model?: string; fallbackProvider?: 'groq' | 'openai' } = {}): Promise<string> {
        try {
            // 1. Try Gemini first (use gemini-flash-latest to avoid strict 20 req/day limit on 2.5)
            return await this.generateWithGemini(prompt, options.model || 'gemini-flash-latest');
        } catch (error) {
            console.error('Gemini API Error:', error.message);
            
            // Check for quota, overload, or timeout errors
            const isQuotaError = error.message?.includes('429') || error.message?.includes('quota');
            const isOverloaded = error.message?.includes('503') || error.message?.includes('overloaded');
            const isTimeout = error.message?.includes('timeout');

            if (isQuotaError || isOverloaded || isTimeout) {
                console.warn(`⚠️ Gemini failed (${isTimeout ? 'timeout' : 'limit/overload'}). Trying fallback AI...`);
                return await this.generateWithFallback(prompt);
            }
            
            // If it's a generic failure, still try fallback to be safe!
            console.warn('⚠️ Gemini failed with generic error. Trying fallback AI as a last resort...');
            return await this.generateWithFallback(prompt);
        }
    }

    private async generateWithGemini(prompt: string, modelName: string): Promise<string> {
        if (!this.genAI) throw new Error('Gemini API key missing');
        const model = this.genAI.getGenerativeModel({ model: modelName });
        
        // Add 8-second timeout for serverless environments like Vercel
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('timeout')), 8000);
        });

        const result = await Promise.race([
            model.generateContent(prompt),
            timeoutPromise
        ]);
        
        return result.response.text();
    }

    private async generateWithFallback(prompt: string): Promise<string> {
        const fallbackKey = this.configService.get<string>('FALLBACK_AI_KEY');
        const fallbackProvider = this.configService.get<string>('FALLBACK_AI_PROVIDER') || 'groq';

        if (!fallbackKey) {
            console.warn('❌ No fallback AI key provided. AI features will use defaults.');
            throw new Error('No fallback AI available');
        }

        try {
            if (fallbackProvider === 'groq') {
                return await this.callGroq(prompt, fallbackKey);
            } else if (fallbackProvider === 'openrouter') {
                return await this.callOpenRouter(prompt, fallbackKey);
            } else if (fallbackProvider === 'openai') {
                return await this.callOpenAI(prompt, fallbackKey);
            }
        } catch (err) {
            console.error('Fallback AI also failed:', err.message);
        }

        throw new Error('All AI providers failed');
    }

    private async callOpenRouter(prompt: string, apiKey: string): Promise<string> {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://universe.app', // Optional for OpenRouter
                'X-Title': 'UniVerse App', // Optional for OpenRouter
            },
            body: JSON.stringify({
                model: 'openrouter/free',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenRouter API error: ${response.statusText} ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    private async callGroq(prompt: string, apiKey: string): Promise<string> {
        // Groq has an OpenAI-compatible API
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    private async callOpenAI(prompt: string, apiKey: string): Promise<string> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}
