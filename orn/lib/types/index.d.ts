/**
 * Functions Type Definitions
 * Local copies of shared types for Firebase Functions
 */
export declare enum BookingStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    CANCELLED = "cancelled",
    COMPLETED = "completed"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare enum ServiceType {
    TOUR = "tour",
    RENTAL = "rental",
    CLASS = "class",
    TRAINING = "training",
    PACKAGE = "package"
}
export interface Booking {
    id: string;
    serviceId: string;
    customerId: string;
    date: string;
    startTime: string;
    endTime: string;
    participants: number;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    totalAmount: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
export interface Service {
    id: string;
    name: string;
    type: ServiceType;
    description: string;
    basePrice: number;
    duration: number;
    maxCapacity: number;
    minAge: number;
    isActive: boolean;
    location: string;
    imageUrl?: string;
    createdAt: string;
    bookingCount: number;
}
export interface Customer {
    id: string;
    email: string;
    phone?: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    createdAt: string;
    bookingHistory: string[];
}
//# sourceMappingURL=index.d.ts.map