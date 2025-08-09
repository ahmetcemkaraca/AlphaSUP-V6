/**
 * Availability Service
 * Handles service availability calculations and booking conflicts
 *
 * @version 1.0.0
 */
export interface TimeSlot {
    time: string;
    available: boolean;
    capacity: number;
    bookedCapacity: number;
    availableCapacity: number;
}
export interface ServiceAvailability {
    serviceId: string;
    date: string;
    timeSlots: TimeSlot[];
    totalCapacity: number;
    totalBooked: number;
    totalAvailable: number;
}
/**
 * Check service availability for a specific date
 */
export declare const checkServiceAvailability: (serviceId: string, date: string) => Promise<ServiceAvailability>;
/**
 * Check if a booking can be made
 */
export declare const canMakeBooking: (serviceId: string, date: string, timeSlot: string, participantCount: number) => Promise<{
    canBook: boolean;
    reason?: string;
}>;
/**
 * Get available dates for a service
 */
export declare const getAvailableDates: (serviceId: string, startDate: Date, endDate: Date) => Promise<string[]>;
declare const _default: {
    checkServiceAvailability: (serviceId: string, date: string) => Promise<ServiceAvailability>;
    canMakeBooking: (serviceId: string, date: string, timeSlot: string, participantCount: number) => Promise<{
        canBook: boolean;
        reason?: string;
    }>;
    getAvailableDates: (serviceId: string, startDate: Date, endDate: Date) => Promise<string[]>;
};
export default _default;
//# sourceMappingURL=availabilityService.d.ts.map