import { NextFunction, Request, Response } from 'express';
/**
 * Base error class for API errors
 */
export declare class ApiError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;
    constructor(message: string, statusCode?: number, code?: string, isOperational?: boolean);
}
/**
 * Not found error (404)
 */
export declare class NotFoundError extends ApiError {
    constructor(resource?: string);
}
/**
 * Validation error (400)
 */
export declare class ValidationError extends ApiError {
    details?: any;
    constructor(message: string, details?: any);
}
/**
 * Authentication error (401)
 */
export declare class AuthError extends ApiError {
    constructor(message?: string);
}
/**
 * Authorization error (403)
 */
export declare class AuthorizationError extends ApiError {
    constructor(message?: string);
}
/**
 * Conflict error (409)
 */
export declare class ConflictError extends ApiError {
    constructor(message: string);
}
/**
 * Rate limit error (429)
 */
export declare class RateLimitError extends ApiError {
    constructor(message?: string);
}
/**
 * Service unavailable error (503)
 */
export declare class ServiceUnavailableError extends ApiError {
    constructor(message?: string);
}
/**
 * Central error handling middleware
 * Bu middleware tüm route'ların sonunda kullanılmalı
 */
export declare const errorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * 404 handler for unmatched routes
 */
export declare const notFoundHandler: (req: Request, res: Response) => void;
/**
 * Async error wrapper
 * Route handler'ları wrap etmek için kullanılır
 */
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Helper function to create standardized API responses
 */
export declare const createApiResponse: <T>(data: T, message?: string) => {
    timestamp: string;
    message?: string | undefined;
    success: boolean;
    data: T;
};
/**
 * Helper function to create paginated API responses
 */
export declare const createPaginatedResponse: <T>(data: T[], page: number, limit: number, total: number, message?: string) => {
    timestamp: string;
    message?: string | undefined;
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
};
//# sourceMappingURL=errorHandler.d.ts.map