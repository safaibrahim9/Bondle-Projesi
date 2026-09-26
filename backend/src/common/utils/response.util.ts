export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    timestamp: string;
}

export class ResponseUtil {
    static success<T>(data: T, message?: string): ApiResponse<T> {
        return {
            success: true,
            data,
            message,
            timestamp: new Date().toISOString(),
        };
    }

    static error(error: string, message?: string): ApiResponse<null> {
        return {
            success: false,
            error,
            message,
            timestamp: new Date().toISOString(),
        };
    }

    static paginated<T>(
        data: T[],
        page: number,
        limit: number,
        total: number,
    ): PaginatedResponse<T> {
        return {
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            timestamp: new Date().toISOString(),
        };
    }
}
