"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerFeedbackController = void 0;
const firebase_1 = require("../config/firebase");
const errorHandler_1 = require("../middleware/errorHandler");
const feedbackRatingService_1 = require("../services/feedbackRatingService");
/**
 * Customer Feedback Controller
 * Handles review submission and retrieval
 */
class CustomerFeedbackController {
    constructor() {
        this.feedbackService = new feedbackRatingService_1.FeedbackRatingService();
    }
    /**
     * Submit a new review
     */
    async submitReview(req, res, next) {
        try {
            // Extract user ID from authenticated request
            const customerId = req.user?.uid;
            if (!customerId) {
                throw new errorHandler_1.ApiError('Authentication required', 401);
            }
            const reviewData = {
                customerId,
                bookingId: req.body.bookingId,
                rating: req.body.rating,
                title: req.body.title,
                comment: req.body.comment,
                isAnonymous: req.body.isAnonymous ?? false,
                isPublic: req.body.isPublic ?? true,
                photos: req.body.photos || []
            };
            // Validate required fields
            if (!reviewData.bookingId || !reviewData.rating || !reviewData.comment) {
                throw new errorHandler_1.ApiError('Missing required fields: bookingId, rating, comment', 400);
            }
            if (reviewData.rating < 1 || reviewData.rating > 5) {
                throw new errorHandler_1.ApiError('Rating must be between 1 and 5', 400);
            }
            const result = await this.feedbackService.submitReview(reviewData);
            res.status(201).json({
                success: true,
                data: {
                    review: result,
                    message: 'Review submitted successfully'
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get reviews for a specific service
     */
    async getServiceReviews(req, res, next) {
        try {
            const serviceId = req.params['serviceId'];
            if (!serviceId) {
                throw new errorHandler_1.ApiError('Service ID is required', 400);
            }
            const page = parseInt(req.query['page']) || 1;
            const limit = Math.min(parseInt(req.query['limit']) || 10, 50); // Max 50 per request
            const filters = {};
            if (req.query['rating']) {
                const rating = parseInt(req.query['rating']);
                if (rating >= 1 && rating <= 5) {
                    filters.rating = rating;
                }
            }
            if (req.query['verified']) {
                filters.verified = req.query['verified'] === 'true';
            }
            if (req.query['sortBy']) {
                const validSortOptions = ['newest', 'oldest', 'highest', 'lowest', 'helpful'];
                if (validSortOptions.includes(req.query['sortBy'])) {
                    filters.sortBy = req.query['sortBy'];
                }
            }
            const data = await this.feedbackService.getServiceReviews(serviceId, page, limit, filters);
            res.json({
                success: true,
                data: {
                    ...data,
                    meta: {
                        serviceId,
                        filters,
                        timestamp: new Date().toISOString()
                    }
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get all reviews by a customer
     */
    async getCustomerReviews(req, res, next) {
        try {
            const customerId = req.params['customerId'];
            const authenticatedUserId = req.user?.uid;
            if (!customerId) {
                throw new errorHandler_1.ApiError('Customer ID is required', 400);
            }
            // Check if user is requesting their own reviews or if they are admin
            const isOwnReviews = customerId === authenticatedUserId;
            const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
            if (!isOwnReviews && !isAdmin) {
                throw new errorHandler_1.ApiError('Unauthorized access to customer reviews', 403);
            }
            const page = parseInt(req.query['page']) || 1;
            const limit = Math.min(parseInt(req.query['limit']) || 10, 50);
            let query = firebase_1.db.collection('reviews')
                .where('customerId', '==', customerId);
            // For non-admin users, only show approved and public reviews
            if (!isAdmin) {
                query = query
                    .where('status', '==', 'approved')
                    .where('isPublic', '==', true);
            }
            query = query.orderBy('createdAt', 'desc');
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
            res.json({
                success: true,
                data: {
                    reviews,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasNext: page < Math.ceil(total / limit),
                        hasPrev: page > 1
                    },
                    meta: {
                        customerId,
                        isOwnReviews,
                        timestamp: new Date().toISOString()
                    }
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get customer review statistics
     */
    async getCustomerReviewStats(req, res, next) {
        try {
            const customerId = req.params['customerId'];
            const authenticatedUserId = req.user?.uid;
            if (!customerId) {
                throw new errorHandler_1.ApiError('Customer ID is required', 400);
            }
            // Check permissions
            const isOwnStats = customerId === authenticatedUserId;
            const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
            if (!isOwnStats && !isAdmin) {
                throw new errorHandler_1.ApiError('Unauthorized access to customer statistics', 403);
            }
            const reviewsSnapshot = await firebase_1.db.collection('reviews')
                .where('customerId', '==', customerId)
                .where('status', '==', 'approved')
                .get();
            const reviews = reviewsSnapshot.docs.map(doc => doc.data());
            const totalReviews = reviews.length;
            const verifiedReviews = reviews.filter(r => r.isVerified).length;
            const averageRating = totalReviews > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
                : 0;
            const helpfulVotes = reviews.reduce((sum, r) => sum + (r.helpfulVotes || 0), 0);
            // Fix the potential undefined issue
            const sortedReviews = reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const lastReviewDate = sortedReviews.length > 0 ? sortedReviews[0]?.createdAt : undefined;
            const stats = {
                customerId,
                totalReviews,
                averageRating: Math.round(averageRating * 10) / 10,
                verifiedReviews,
                helpfulVotes,
                lastReviewDate
            };
            res.json({
                success: true,
                data: {
                    stats,
                    meta: {
                        isOwnStats,
                        timestamp: new Date().toISOString()
                    }
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CustomerFeedbackController = CustomerFeedbackController;
//# sourceMappingURL=customerFeedbackController.js.map