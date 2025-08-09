/**
 * Service Controller
 * Handles customer-facing service operations
 * Enhanced with comprehensive service management
 *
 * @version 2.0.0
 */
import { NextFunction, Request, Response } from 'express';
/**
 * Get all available services with advanced filtering
 * GET /api/v1/services
 */
export declare const getServices: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get service by ID with enhanced data
 * GET /api/v1/services/:id
 */
export declare const getServiceById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get featured services
 */
export declare const getFeaturedServices: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get service categories
 */
export declare const getServiceCategories: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Search services with enhanced filtering
 */
export declare const searchServices: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get service availability with real-time booking data
 */
export declare const getServiceAvailability: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get service pricing with detailed breakdown
 */
export declare const getServicePricing: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=serviceController.d.ts.map