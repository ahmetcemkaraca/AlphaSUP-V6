/**
 * Authentication Middleware
 *
 * This middleware protects routes by verifying Firebase Authentication tokens
 * and checking user roles.
 *
 * @version 2.0.0
 */
import { RequestHandler } from 'express';
export declare const protect: RequestHandler;
export declare const adminOnly: RequestHandler;
//# sourceMappingURL=authMiddleware.d.ts.map