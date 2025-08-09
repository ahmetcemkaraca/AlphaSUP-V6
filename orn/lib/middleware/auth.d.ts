/**
 * Authentication Middleware
 * Kimlik doğrulama ve yetkilendirme middleware'i
 */
import { NextFunction, Request, Response } from 'express';
export declare enum UserRole {
    USER = "user",
    ADMIN = "admin",
    EDITOR = "editor",
    CUSTOMER = "customer",
    SUPER_ADMIN = "super_admin"
}
export declare class AuthMiddleware {
    /**
     * Authenticate user with Firebase token
     */
    authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Require admin role
     */
    requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Require editor role or higher
     */
    requireEditor: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Require customer role (for customer-specific endpoints)
     */
    requireCustomer: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Optional authentication (doesn't fail if no token)
     */
    optionalAuth: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
}
export default AuthMiddleware;
