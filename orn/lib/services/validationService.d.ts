/**
 * Validation Service
 * Input validation for API requests
 *
 * @version 1.0.0
 */
interface ServiceSearchParams {
    query?: string;
    category?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    date?: string;
    duration?: number;
    capacity?: number;
    difficulty?: string;
    location?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
/**
 * Validate service search parameters
 */
export declare const validateServiceSearchParams: (params: any) => {
    isValid: boolean;
    errors: string[];
    cleanedParams: ServiceSearchParams;
};
/**
 * Validate service ID parameter
 */
export declare const validateServiceId: (id: string) => {
    isValid: boolean;
    error?: string;
};
/**
 * Validate date parameter
 */
export declare const validateDate: (date: string) => {
    isValid: boolean;
    error?: string;
    parsedDate?: Date;
};
/**
 * Validate participant count
 */
export declare const validateParticipantCount: (count: string | number) => {
    isValid: boolean;
    error?: string;
    count?: number;
};
export {};
//# sourceMappingURL=validationService.d.ts.map