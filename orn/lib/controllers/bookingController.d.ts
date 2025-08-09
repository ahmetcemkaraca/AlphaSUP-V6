/**
 * Booking Controller
 * Handles booking-related HTTP requests with enhanced payment options
 */
import { NextFunction, Request, Response } from 'express';
export type PaymentType = 'full' | 'deposit' | 'remaining';
export declare enum BookingStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    CANCELLED = "cancelled",
    COMPLETED = "completed"
}
export interface BookingPaymentData {
    type: PaymentType;
    amount: number;
    currency: string;
    stripePaymentIntentId?: string;
    remainingAmount?: number;
    dueDate?: string;
    paidAmount?: number;
    totalAmount?: number;
}
export declare const createBooking: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getBookingById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const processRemainingPayment: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateBookingStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=bookingController.d.ts.map