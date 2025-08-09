export declare enum BookingStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    CANCELLED = "cancelled",
    COMPLETED = "completed"
}
export declare enum PaymentType {
    DEPOSIT = "deposit",
    FULL = "full"
}
export interface BookingValidationData {
    customerId: string;
    serviceId: string;
    date: string;
    timeSlot: string;
    participantCount: number;
    totalAmount: number;
    paymentType?: PaymentType;
    status?: BookingStatus;
    boardSelections?: string[];
    additionalServices?: string[];
}
export declare function validateBookingData(data: BookingValidationData): {
    isValid: boolean;
    errors: string[];
};
export declare function validatePaymentType(paymentType: string): boolean;
export declare function validateBookingStatus(status: string): boolean;
export declare function calculateDepositAmount(totalAmount: number, depositPercentage?: number): number;
export declare function calculateRemainingAmount(totalAmount: number, depositAmount: number): number;
export declare function generatePaymentDueDate(hoursFromNow?: number): Date;
//# sourceMappingURL=validation.d.ts.map