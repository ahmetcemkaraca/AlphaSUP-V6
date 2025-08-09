/**
 * Authentication Middleware
 * Kimlik doğrulama ve yetkilendirme middleware'i
 */

import { NextFunction, Request, Response } from 'express';
import { auth } from 'firebase-admin';

// Define UserRole enum locally
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  EDITOR = 'editor',
  CUSTOMER = 'customer',
  SUPER_ADMIN = 'super_admin',
}

export class AuthMiddleware {
  /**
   * Authenticate user with Firebase token
   */
  authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization header required',
          },
        });
        return;
      }

      const token = authHeader.split('Bearer ')[1];

      // Verify Firebase token
      const decodedToken = await auth().verifyIdToken(token);

      // Get user role from custom claims or default to USER
      const userRole = (decodedToken.role as UserRole) || UserRole.USER;

      // Attach user info to request
      req.user = {
        uid: decodedToken.uid,
        role: userRole,
        isAdmin:
          userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN,
        isEditor:
          userRole === UserRole.EDITOR ||
          userRole === UserRole.ADMIN ||
          userRole === UserRole.SUPER_ADMIN,
      };

      if (decodedToken.email) {
        req.user.email = decodedToken.email;
      }

      next();
    } catch (error: any) {
      console.error('Authentication error:', error);
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    }
  };

  /**
   * Require admin role
   */
  requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user?.isAdmin) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
      return;
    }
    next();
  };

  /**
   * Require editor role or higher
   */
  requireEditor = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user?.isEditor) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Editor access required',
        },
      });
      return;
    }
    next();
  };

  /**
   * Require customer role (for customer-specific endpoints)
   */
  requireCustomer = (req: Request, res: Response, next: NextFunction): void => {
    if (
      !req.user ||
      (req.user.role !== UserRole.CUSTOMER && !req.user.isAdmin)
    ) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Customer access required',
        },
      });
      return;
    }
    next();
  };

  /**
   * Optional authentication (doesn't fail if no token)
   */
  optionalAuth = async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await auth().verifyIdToken(token);
        const userRole = (decodedToken.role as UserRole) || UserRole.USER;

        req.user = {
          uid: decodedToken.uid,
          role: userRole,
          isAdmin:
            userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN,
          isEditor:
            userRole === UserRole.EDITOR ||
            userRole === UserRole.ADMIN ||
            userRole === UserRole.SUPER_ADMIN,
        };

        if (decodedToken.email) {
          req.user.email = decodedToken.email;
        }
      }

      next();
    } catch (error) {
      // If token is invalid, continue without authentication
      next();
    }
  };
}

export default AuthMiddleware;
