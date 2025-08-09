"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackRatingService = void 0;
const tslib_1 = require("tslib");
const admin = tslib_1.__importStar(require("firebase-admin"));
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * Customer Feedback and Rating System
 * Comprehensive feedback collection and analysis
 */
class FeedbackRatingService {
    constructor() {
        this.db = admin.firestore();
    }
    /**
     * Submit customer review
     */
    async submitReview(reviewData) {
        try {
            // Validate booking ownership
            const bookingDoc = await this.db.collection('bookings').doc(reviewData.bookingId).get();
            if (!bookingDoc.exists) {
                throw new errorHandler_1.ApiError('Booking not found', 404);
            }
            const booking = bookingDoc.data();
            if (booking['customerId'] !== reviewData.customerId) {
                throw new errorHandler_1.ApiError('Unauthorized access to booking', 403);
            }
            if (booking['status'] !== 'completed') {
                throw new errorHandler_1.ApiError('Cannot review incomplete booking', 400);
            }
            // Prevent duplicate review per booking
            const existingReview = await this.db.collection('reviews')
                .where('bookingId', '==', reviewData.bookingId)
                .limit(1)
                .get();
            if (!existingReview.empty) {
                throw new errorHandler_1.ApiError('Review already submitted for this booking', 400);
            }
            // Create review
            const now = new Date().toISOString();
            const review = {
                ...reviewData,
                serviceId: booking['serviceId'],
                serviceName: booking['serviceName'] || 'Unknown Service',
                customerName: `${booking['customerInfo']?.['firstName'] || ''} ${booking['customerInfo']?.['lastName'] || ''}`.trim(),
                isVerified: true, // Since booking is verified
                isPublic: reviewData.isPublic ?? true,
                isAnonymous: reviewData.isAnonymous ?? false,
                helpfulVotes: 0,
                reportCount: 0,
                status: this.requiresModeration(reviewData) ? 'pending' : 'approved',
                createdAt: now,
                updatedAt: now,
                reviewedAt: now
            };
            const reviewRef = await this.db.collection('reviews').add(review);
            // Update service rating summary
            await this.updateServiceRatingSummary(booking['serviceId']);
            // Update customer stats
            await this.updateCustomerReviewStats(reviewData.customerId);
            // Mark feedback request as responded
            await this.markFeedbackRequestResponded(reviewData.bookingId);
            const createdReview = await reviewRef.get();
            return { id: reviewRef.id, ...createdReview.data() };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errorHandler_1.ApiError(`Failed to submit review: ${errorMessage}`, 500);
        }
    }
    /**
     * Get service reviews with pagination and filters
     */
    async getServiceReviews(serviceId, page = 1, limit = 10, filters = {}) {
        try {
            let query = this.db.collection('reviews')
                .where('serviceId', '==', serviceId)
                .where('status', '==', 'approved')
                .where('isPublic', '==', true);
            // Apply filters
            if (filters.rating) {
                query = query.where('rating', '==', filters.rating);
            }
            if (filters.verified !== undefined) {
                query = query.where('isVerified', '==', filters.verified);
            }
            // Apply sorting
            switch (filters.sortBy) {
                case 'newest':
                    query = query.orderBy('createdAt', 'desc');
                    break;
                case 'oldest':
                    query = query.orderBy('createdAt', 'asc');
                    break;
                case 'highest':
                    query = query.orderBy('rating', 'desc').orderBy('createdAt', 'desc');
                    break;
                case 'lowest':
                    query = query.orderBy('rating', 'asc').orderBy('createdAt', 'desc');
                    break;
                case 'helpful':
                    query = query.orderBy('helpfulVotes', 'desc').orderBy('createdAt', 'desc');
                    break;
                default:
                    query = query.orderBy('createdAt', 'desc');
            }
            // Get total count
            const totalSnapshot = await query.get();
            const total = totalSnapshot.size;
            // Apply pagination
            const offset = (page - 1) * limit;
            const paginatedQuery = query.offset(offset).limit(limit);
            const snapshot = await paginatedQuery.get();
            const reviews = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Get summary
            const summary = await this.getServiceReviewSummary(serviceId);
            return {
                reviews,
                summary,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errorHandler_1.ApiError(`Failed to fetch reviews: ${errorMessage}`, 500);
        }
    }
    /**
     * Get service review summary
     */
    async getServiceReviewSummary(serviceId) {
        try {
            const reviewsSnapshot = await this.db.collection('reviews')
                .where('serviceId', '==', serviceId)
                .where('status', '==', 'approved')
                .get();
            const reviews = reviewsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            const totalReviews = reviews.length;
            const verifiedReviews = reviews.filter(r => r.isVerified);
            const publicReviews = reviews.filter(r => r.isPublic);
            const averageRating = totalReviews > 0
                ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
                : 0;
            // Rating distribution
            const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            reviews.forEach(review => {
                if (review.rating && ratingDistribution[review.rating] !== undefined) {
                    ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
                }
            });
            // Recent reviews - sort by createdAt string comparison
            const recentReviews = reviews
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5);
            return {
                serviceId,
                totalReviews,
                averageRating: Math.round(averageRating * 10) / 10,
                ratingDistribution,
                verifiedReviewsCount: verifiedReviews.length,
                publicReviewsCount: publicReviews.length,
                recentReviews,
                lastUpdated: new Date().toISOString()
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errorHandler_1.ApiError(`Failed to get review summary: ${errorMessage}`, 500);
        }
    }
    /**
     * Update service rating summary
     */
    async updateServiceRatingSummary(serviceId) {
        const summary = await this.getServiceReviewSummary(serviceId);
        await this.db.collection('services').doc(serviceId).update({
            averageRating: summary.averageRating,
            totalReviews: summary.totalReviews,
            ratingDistribution: summary.ratingDistribution,
            lastReviewUpdate: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    /**
     * Update customer review stats
     */
    async updateCustomerReviewStats(customerId) {
        const customerReviews = await this.db.collection('reviews')
            .where('customerId', '==', customerId)
            .get();
        await this.db.collection('customers').doc(customerId).update({
            totalReviews: customerReviews.size,
            lastReviewDate: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    /**
     * Mark feedback request as responded
     */
    async markFeedbackRequestResponded(bookingId) {
        const requestsSnapshot = await this.db.collection('feedbackRequests')
            .where('bookingId', '==', bookingId)
            .get();
        const batch = this.db.batch();
        requestsSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, {
                respondedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        await batch.commit();
    }
    /**
     * Check if review requires moderation
     */
    requiresModeration(reviewData) {
        // Check for potentially inappropriate content
        const flaggedWords = ['spam', 'fake', 'terrible', 'worst', 'never'];
        const reviewText = `${reviewData.title || ''} ${reviewData.comment}`.toLowerCase();
        return flaggedWords.some(word => reviewText.includes(word)) ||
            (reviewData.rating !== undefined && reviewData.rating <= 2);
    }
}
exports.FeedbackRatingService = FeedbackRatingService;
//# sourceMappingURL=feedbackRatingService.js.map