/**
 * Customer Stats Controller
 * Handles customer statistics, upcoming bookings, and recent activity
 *
 * @version 1.0.0
 */
import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../../../shared/src/types/auth';
/**
 * Get customer statistics
 * GET /api/v1/customers/stats
 */
export declare const getCustomerStats: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get upcoming bookings
 * GET /api/v1/customers/bookings/upcoming
 */
export declare const getUpcomingBookings: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get recent activity
 * GET /api/v1/customers/activity/recent
 */
export declare const getRecentActivity: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=customerStatsController.d.ts.map