/**
 * Get revenue analytics
 * Query: period=week|month|year
 */
export declare const getRevenueAnalytics: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get service performance analytics
 * Query: period=week|month|year
 */
export declare const getServicePerformance: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get business metrics
 */
export declare const getBusinessMetrics: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get simplified dashboard overview for admin panel
 */
export declare const getDashboard: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Admin Controller
 * Handles admin-specific operations for business management
 */
import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../../../shared/src/types/auth';
/**
 * Get dashboard statistics for admin panel
 */
export declare const getDashboardStats: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Advanced filtering/search for services
 */
export declare const searchServices: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Advanced filtering/search for bookings
 */
export declare const searchBookings: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Advanced filtering/search for equipment
 */
export declare const searchEquipment: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Export services data (CSV/PDF)
 */
export declare const exportServices: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Export bookings data (CSV/PDF)
 */
export declare const exportBookings: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Export equipment data (CSV/PDF)
 */
export declare const exportEquipment: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Import services data (CSV upload)
 */
export declare const importServices: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Import bookings data (CSV upload)
 */
export declare const importBookings: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Import equipment data (CSV upload)
 */
export declare const importEquipment: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get all customers with pagination and search
 */
export declare const getCustomers: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get a specific customer by ID
 */
export declare const getCustomer: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response | void>;
/**
 * Get all services with filtering
 */
export declare const getServices: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Create a new service
 */
export declare const createService: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Update an existing service
 */
export declare const updateService: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response | void>;
/**
 * Delete a service
 */
export declare const deleteService: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response | void>;
/**
 * Get all bookings with filtering and pagination
 */
export declare const getBookings: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Update booking status
 */
export declare const updateBookingStatus: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response | void>;
/**
 * Get business settings
 */
export declare const getBusinessSettings: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Update business settings
 */
export declare const updateBusinessSettings: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=adminController.d.ts.map