import { ReviewFilters, ReviewPaginationResult, ReviewSubmissionData, ReviewSummary, ServiceReview } from '../../../shared/src/types/review';
/**
 * Customer Feedback and Rating System
 * Comprehensive feedback collection and analysis
 */
export declare class FeedbackRatingService {
    private db;
    /**
     * Submit customer review
     */
    submitReview(reviewData: ReviewSubmissionData): Promise<ServiceReview>;
    /**
     * Get service reviews with pagination and filters
     */
    getServiceReviews(serviceId: string, page?: number, limit?: number, filters?: ReviewFilters): Promise<ReviewPaginationResult>;
    /**
     * Get service review summary
     */
    getServiceReviewSummary(serviceId: string): Promise<ReviewSummary>;
    /**
     * Update service rating summary
     */
    private updateServiceRatingSummary;
    /**
     * Update customer review stats
     */
    private updateCustomerReviewStats;
    /**
     * Mark feedback request as responded
     */
    private markFeedbackRequestResponded;
    /**
     * Check if review requires moderation
     */
    private requiresModeration;
}
//# sourceMappingURL=feedbackRatingService.d.ts.map