"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoyaltyProgramService = void 0;
const tslib_1 = require("tslib");
const admin = tslib_1.__importStar(require("firebase-admin"));
const errorHandler_1 = require("../middleware/errorHandler");
const notificationService_1 = require("./notificationService");
class LoyaltyProgramService {
    constructor() {
        this.db = admin.firestore();
        this.notificationService = new notificationService_1.NotificationService();
    }
    /**
     * Get customer loyalty status
     */
    async getCustomerLoyalty(customerId) {
        try {
            // Get customer loyalty data
            const loyaltyDoc = await this.db.collection('customerLoyalty').doc(customerId).get();
            let loyalty;
            if (!loyaltyDoc.exists) {
                loyalty = await this.initializeCustomerLoyalty(customerId);
            }
            else {
                loyalty = loyaltyDoc.data();
                // Firestore Timestamp -> Date dönüşümü
                loyalty.lastActivity = this.toDateSafe(loyalty.lastActivity);
                loyalty.memberSince = this.toDateSafe(loyalty.memberSince);
                if (loyalty.achievements && loyalty.achievements.length > 0) {
                    loyalty.achievements = loyalty.achievements.map(a => ({
                        ...a,
                        unlockedAt: this.toDateSafe(a.unlockedAt)
                    }));
                }
            }
            // Get tier information
            const tiers = await this.getLoyaltyTiers();
            const currentTierInfo = tiers.find(t => t.id === loyalty.currentTier);
            const nextTierInfo = tiers.find(t => t.minPoints > loyalty.currentPoints);
            // Calculate points to next tier
            const pointsToNextTier = nextTierInfo ? nextTierInfo.minPoints - loyalty.currentPoints : 0;
            // Get recent transactions
            const recentTransactions = await this.getRecentPointTransactions(customerId, 10);
            // Get available rewards
            const availableRewards = await this.getAvailableRewards(loyalty.currentTier, loyalty.currentPoints);
            // Calculate expiring points (next 30 days)
            const expiringPoints = await this.getExpiringPoints(customerId, 30);
            return {
                ...loyalty,
                pointsToNextTier,
                currentTierInfo,
                nextTierInfo,
                recentTransactions,
                availableRewards,
                expiringPoints
            };
        }
        catch (error) {
            let message = 'Failed to get loyalty data';
            if (error instanceof Error)
                message += `: ${error.message}`;
            throw new errorHandler_1.ApiError(message, 500);
        }
    }
    /**
     * Award points for booking
     */
    async awardPointsForBooking(bookingId, customerId, amount) {
        try {
            const loyalty = await this.getOrCreateCustomerLoyalty(customerId);
            const tier = await this.getCustomerTier(loyalty.currentTier);
            // Apply tier multiplier
            const pointsToAward = Math.floor(amount * tier.multiplier);
            // Award points
            await this.addPointTransaction({
                customerId,
                type: 'earned',
                points: pointsToAward,
                description: `Points earned from booking #${bookingId}`,
                source: bookingId,
                metadata: {
                    originalAmount: amount,
                    multiplier: tier.multiplier,
                    tierLevel: tier.name
                },
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiry
            });
            // Check for tier upgrade
            await this.checkTierUpgrade(customerId);
            // Check for achievements
            await this.checkAchievements(customerId);
            // Send notification
            await this.notificationService.sendPointsEarnedNotification(customerId, pointsToAward);
        }
        catch (error) {
            let message = 'Failed to award points';
            if (error instanceof Error)
                message += `: ${error.message}`;
            throw new errorHandler_1.ApiError(message, 500);
        }
    }
    /**
     * Redeem reward
     */
    async redeemReward(customerId, rewardId) {
        try {
            const [loyalty, reward] = await Promise.all([
                this.getOrCreateCustomerLoyalty(customerId),
                this.getReward(rewardId)
            ]);
            // Validate redemption
            if (!reward.isActive) {
                throw new errorHandler_1.ApiError('Reward is no longer available', 400);
            }
            if (loyalty.currentPoints < reward.pointsCost) {
                throw new errorHandler_1.ApiError('Insufficient points for this reward', 400);
            }
            if (reward.stock !== undefined && reward.stock <= 0) {
                throw new errorHandler_1.ApiError('Reward is out of stock', 400);
            }
            // Create redemption record
            const redemption = {
                customerId,
                rewardId,
                pointsCost: reward.pointsCost,
                status: 'active',
                redeemedAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: new Date(Date.now() + reward.expirationDays * 24 * 60 * 60 * 1000),
                usageCount: 0,
                maxUsages: 1
            };
            const redemptionRef = await this.db.collection('loyaltyRedemptions').add(redemption);
            // Deduct points
            await this.addPointTransaction({
                customerId,
                type: 'redeemed',
                points: -reward.pointsCost,
                description: `Redeemed: ${reward.title}`,
                source: redemptionRef.id,
                metadata: {
                    rewardId,
                    rewardTitle: reward.title
                },
                createdAt: new Date()
            });
            // Update stock if applicable
            if (reward.stock !== undefined) {
                await this.db.collection('loyaltyRewards').doc(rewardId).update({
                    stock: admin.firestore.FieldValue.increment(-1)
                });
            }
            // Send notification
            await this.notificationService.sendRewardRedeemedNotification(customerId, reward, redemptionRef.id);
            const updatedLoyalty = await this.getOrCreateCustomerLoyalty(customerId);
            return {
                success: true,
                redemptionId: redemptionRef.id,
                reward,
                remainingPoints: updatedLoyalty.currentPoints
            };
        }
        catch (error) {
            let message = 'Failed to redeem reward';
            if (error instanceof Error)
                message += `: ${error.message}`;
            throw new errorHandler_1.ApiError(message, 500);
        }
    }
    /**
     * Get loyalty tiers
     */
    async getLoyaltyTiers() {
        const snapshot = await this.db.collection('loyaltyTiers')
            .orderBy('minPoints', 'asc')
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
    /**
     * Get available rewards for customer
     */
    async getAvailableRewards(tierLevel, currentPoints) {
        const snapshot = await this.db.collection('loyaltyRewards')
            .where('isActive', '==', true)
            .where('pointsCost', '<=', currentPoints)
            .orderBy('pointsCost', 'asc')
            .get();
        // Tier kısıtlaması kontrolü
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((reward) => {
            if (reward.allowedTiers && Array.isArray(reward.allowedTiers)) {
                return reward.allowedTiers.includes(tierLevel);
            }
            return true;
        });
    }
    /**
     * Get customer redemption history
     */
    async getRedemptionHistory(customerId) {
        const snapshot = await this.db.collection('loyaltyRedemptions')
            .where('customerId', '==', customerId)
            .orderBy('redeemedAt', 'desc')
            .limit(20)
            .get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                rewardId: data.rewardId,
                pointsCost: data.pointsCost,
                status: data.status,
                redeemedAt: data.redeemedAt && data.redeemedAt.toDate ? data.redeemedAt.toDate() : data.redeemedAt,
                expiresAt: data.expiresAt && data.expiresAt.toDate ? data.expiresAt.toDate() : data.expiresAt,
                usageCount: data.usageCount,
                maxUsages: data.maxUsages
            };
        });
    }
    /**
     * Check daily login bonus
     */
    async checkDailyLoginBonus(customerId) {
        try {
            const loyalty = await this.getOrCreateCustomerLoyalty(customerId);
            const today = new Date();
            const lastActivity = loyalty.lastActivity;
            // Check if already claimed today
            if (lastActivity && this.isSameDay(lastActivity, today)) {
                return 0; // Already claimed today
            }
            // Calculate streak
            let newStreak = 1;
            if (lastActivity && this.isConsecutiveDay(lastActivity, today)) {
                newStreak = loyalty.streakDays + 1;
            }
            // Calculate bonus points (increases with streak, max 50 points)
            const bonusPoints = Math.min(5 + Math.floor(newStreak / 7) * 5, 50);
            // Award points
            await this.addPointTransaction({
                customerId,
                type: 'bonus',
                points: bonusPoints,
                description: `Daily login bonus (day ${newStreak})`,
                source: 'daily_login',
                metadata: {
                    streakDays: newStreak,
                    loginDate: today.toISOString()
                },
                createdAt: new Date()
            });
            // Update loyalty record
            await this.db.collection('customerLoyalty').doc(customerId).update({
                lastActivity: admin.firestore.FieldValue.serverTimestamp(),
                streakDays: newStreak
            });
            return bonusPoints;
        }
        catch (error) {
            let message = 'Failed to process daily bonus';
            if (error instanceof Error)
                message += `: ${error.message}`;
            throw new errorHandler_1.ApiError(message, 500);
        }
    }
    /**
     * Initialize customer loyalty
     */
    async initializeCustomerLoyalty(customerId) {
        const tiers = await this.getLoyaltyTiers();
        const startingTier = tiers[0]; // Bronze tier
        if (!startingTier) {
            throw new errorHandler_1.ApiError('No loyalty tier defined', 500);
        }
        const loyalty = {
            customerId,
            currentPoints: startingTier.welcomeBonus,
            totalPointsEarned: startingTier.welcomeBonus,
            totalPointsRedeemed: 0,
            currentTier: startingTier.id,
            memberSince: new Date(),
            lastActivity: new Date(),
            streakDays: 1,
            achievements: []
        };
        await this.db.collection('customerLoyalty').doc(customerId).set(loyalty);
        // Award welcome bonus
        if (startingTier.welcomeBonus && startingTier.welcomeBonus > 0) {
            await this.addPointTransaction({
                customerId,
                type: 'bonus',
                points: startingTier.welcomeBonus,
                description: 'Welcome bonus',
                source: 'welcome_bonus',
                createdAt: new Date()
            });
        }
        return loyalty;
    }
    /**
     * Güvenli Date/Timestamp dönüşümü
     */
    toDateSafe(val) {
        if (!val)
            return val;
        if (val instanceof Date)
            return val;
        if (typeof val.toDate === 'function')
            return val.toDate();
        return val;
    }
    /**
     * Get or create customer loyalty
     */
    async getOrCreateCustomerLoyalty(customerId) {
        const loyaltyDoc = await this.db.collection('customerLoyalty').doc(customerId).get();
        if (!loyaltyDoc.exists) {
            return await this.initializeCustomerLoyalty(customerId);
        }
        return loyaltyDoc.data();
    }
    /**
     * Add point transaction
     */
    async addPointTransaction(transaction) {
        const transactionRef = await this.db.collection('pointTransactions').add(transaction);
        // Update customer points
        await this.db.collection('customerLoyalty').doc(transaction.customerId).update({
            currentPoints: admin.firestore.FieldValue.increment(transaction.points),
            totalPointsEarned: transaction.points > 0 ? admin.firestore.FieldValue.increment(transaction.points) : undefined,
            totalPointsRedeemed: transaction.points < 0 ? admin.firestore.FieldValue.increment(Math.abs(transaction.points)) : undefined,
            lastActivity: admin.firestore.FieldValue.serverTimestamp()
        });
        return transactionRef.id;
    }
    /**
     * Check for tier upgrade
     */
    async checkTierUpgrade(customerId) {
        const loyalty = await this.getOrCreateCustomerLoyalty(customerId);
        const tiers = await this.getLoyaltyTiers();
        const currentTier = tiers.find(t => t.id === loyalty.currentTier);
        const nextTier = tiers.find(t => t.minPoints <= loyalty.currentPoints && t.minPoints > currentTier.minPoints);
        if (nextTier) {
            await this.db.collection('customerLoyalty').doc(customerId).update({
                currentTier: nextTier.id
            });
            // Send tier upgrade notification
            await this.notificationService.sendTierUpgradeNotification(customerId, nextTier);
        }
    }
    /**
     * Check for achievements
     */
    async checkAchievements(customerId) {
        // Temel örnek: İlk rezervasyon, 10. rezervasyon, yüksek puanlı müşteri
        const loyalty = await this.getOrCreateCustomerLoyalty(customerId);
        const bookingsSnapshot = await this.db.collection('bookings')
            .where('customerId', '==', customerId)
            .get();
        const bookingCount = bookingsSnapshot.size;
        const achievements = loyalty.achievements || [];
        // İlk rezervasyon achievement
        if (bookingCount === 1 && !achievements.some(a => a.id === 'first_booking')) {
            const achievement = {
                id: 'first_booking',
                title: 'İlk Rezervasyon',
                description: 'Tebrikler! İlk rezervasyonunu yaptın.',
                icon: '🎉',
                unlockedAt: new Date(),
                pointsAwarded: 10
            };
            await this.db.collection('customerLoyalty').doc(customerId).update({
                achievements: admin.firestore.FieldValue.arrayUnion(achievement)
            });
            await this.addPointTransaction({
                customerId,
                type: 'bonus',
                points: achievement.pointsAwarded,
                description: 'İlk rezervasyon achievement',
                source: 'achievement_first_booking',
                createdAt: new Date()
            });
        }
        // 10. rezervasyon achievement
        if (bookingCount === 10 && !achievements.some(a => a.id === 'tenth_booking')) {
            const achievement = {
                id: 'tenth_booking',
                title: '10. Rezervasyon',
                description: 'Süpersin! 10 rezervasyon yaptın.',
                icon: '🏆',
                unlockedAt: new Date(),
                pointsAwarded: 25
            };
            await this.db.collection('customerLoyalty').doc(customerId).update({
                achievements: admin.firestore.FieldValue.arrayUnion(achievement)
            });
            await this.addPointTransaction({
                customerId,
                type: 'bonus',
                points: achievement.pointsAwarded,
                description: '10. rezervasyon achievement',
                source: 'achievement_tenth_booking',
                createdAt: new Date()
            });
        }
        // ... Diğer achievement kontrolleri buraya eklenebilir ...
    }
    /**
     * Get recent point transactions
     */
    async getRecentPointTransactions(customerId, limit) {
        const snapshot = await this.db.collection('pointTransactions')
            .where('customerId', '==', customerId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
    /**
     * Get expiring points
     */
    async getExpiringPoints(customerId, days) {
        const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        // Hem 'earned' hem 'bonus' puanları kapsa
        const snapshot = await this.db.collection('pointTransactions')
            .where('customerId', '==', customerId)
            .where('type', 'in', ['earned', 'bonus'])
            .where('expiresAt', '<=', admin.firestore.Timestamp.fromDate(expiryDate))
            .get();
        return snapshot.docs.reduce((total, doc) => {
            const transaction = doc.data();
            return total + transaction.points;
        }, 0);
    }
    /**
     * Helper methods
     */
    async getCustomerTier(tierId) {
        const tierDoc = await this.db.collection('loyaltyTiers').doc(tierId).get();
        return { id: tierDoc.id, ...tierDoc.data() };
    }
    async getReward(rewardId) {
        const rewardDoc = await this.db.collection('loyaltyRewards').doc(rewardId).get();
        if (!rewardDoc.exists) {
            throw new errorHandler_1.ApiError('Reward not found', 404);
        }
        return { id: rewardDoc.id, ...rewardDoc.data() };
    }
    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }
    isConsecutiveDay(lastDate, currentDate) {
        const daysBetween = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysBetween === 1;
    }
}
exports.LoyaltyProgramService = LoyaltyProgramService;
//# sourceMappingURL=loyaltyProgramService.js.map