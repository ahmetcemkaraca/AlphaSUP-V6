import { NextFunction, Request, Response } from 'express';
/**
 * Customer Feedback Controller
 * Handles review submission and retrieval
 */
export declare class CustomerFeedbackController {
    private feedbackService;
    constructor();
    /**
     * Submit a new review
     */
    submitReview(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get reviews for a specific service
     */
    getServiceReviews(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get all reviews by a customer
     */
    getCustomerReviews(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get customer review statistics
     */
    getCustomerReviewStats(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=customerFeedbackController.d.ts.map