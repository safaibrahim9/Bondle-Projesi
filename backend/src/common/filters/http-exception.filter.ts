import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal server error';

        const isProduction = process.env.NODE_ENV === 'production';

        // Extract user-friendly message
        let errorMessage = 'An error occurred';
        if (exception instanceof HttpException) {
            const res = exception.getResponse();
            errorMessage = typeof res === 'object' ? (res as any).message || JSON.stringify(res) : res;
        } else if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
            // Geçici olarak production'da da asıl hatayı göster (hata ayıklama için)
            errorMessage = (exception as any)?.message || 'Internal server error (500)';
        }

        // Standardized error response for frontend
        const errorResponse = {
            success: false,
            error: errorMessage,
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            // Include stack trace ONLY in development
            stack: !isProduction && exception instanceof Error ? exception.stack : undefined,
        };

        // Log error for debugging (server-side only)
        console.error('Error caught by Filter:', {
            ...errorResponse,
            stack: exception instanceof Error ? exception.stack : undefined,
        });

        response.status(status).json(errorResponse);
    }
}
