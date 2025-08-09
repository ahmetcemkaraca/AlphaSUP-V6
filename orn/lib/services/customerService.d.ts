/**
 * Customer Service
 * Handles customer-related business logic and data operations
 */
import { Customer, CustomerProfileUpdate, CustomerSearchParams, CustomerStats } from '../../../shared/src/types/customer';
export declare class CustomerService {
    private auditService;
    constructor();
    /**
     * Get customer by ID
     */
    getCustomerById(customerId: string): Promise<Customer | null>;
    /**
     * Update customer profile
     */
    updateCustomerProfile(customerId: string, updateData: CustomerProfileUpdate, userId: string): Promise<void>;
    /**
     * Search customers with filters
     */
    searchCustomers(params: CustomerSearchParams, page?: number, limit?: number): Promise<{
        customers: Customer[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    /**
     * Get customer statistics
     */
    getCustomerStatistics(): Promise<CustomerStats>;
    /**
     * Update customer loyalty points
     */
    updateLoyaltyPoints(customerId: string, points: number, reason: string, userId: string): Promise<void>;
    /**
     * Update customer booking statistics
     */
    updateBookingStatistics(customerId: string, bookingAmount: number, userId: string): Promise<void>;
    /**
     * Verify customer contact information
     */
    verifyContactInfo(customerId: string, field: 'email' | 'phone', userId: string): Promise<void>;
    /**
     * Delete customer account
     */
    deleteCustomerAccount(customerId: string, userId: string): Promise<void>;
}
//# sourceMappingURL=customerService.d.ts.map