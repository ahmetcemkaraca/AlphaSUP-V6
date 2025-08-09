/**
 * Customer Loyalty Program Service
 * Comprehensive loyalty management with tiers, rewards, and gamification
 */
export interface LoyaltyTier {
    id: string;
    name: string;
    minPoints: number;
    maxPoints?: number;
    benefits: LoyaltyBenefit[];
    color: string;
    icon: string;
    welcomeBonus: number;
    multiplier: number;
}
export interface LoyaltyBenefit {
    type: 'discount' | 'free_service' | 'priority_booking' | 'exclusive_access' | 'birthday_bonus';
    title: string;
    description: string;
    value: number;
    valueType: 'percentage' | 'fixed' | 'points' | 'boolean';
    conditions?: string[];
}
export interface LoyaltyReward {
    id: string;
    title: string;
    description: string;
    pointsCost: number;
    rewardType: 'discount' | 'service' | 'merchandise' | 'experience';
    value: number;
    valueType: 'percentage' | 'fixed';
    isActive: boolean;
    stock?: number;
    expirationDays: number;
    restrictions?: string[];
    imageUrl?: string;
}
export interface CustomerLoyalty {
    customerId: string;
    currentPoints: number;
    totalPointsEarned: number;
    totalPointsRedeemed: number;
    currentTier: string;
    nextTier?: string;
    pointsToNextTier?: number;
    memberSince: Date;
    lastActivity: Date;
    streakDays: number;
    achievements: LoyaltyAchievement[];
}
export interface LoyaltyAchievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: Date;
    pointsAwarded: number;
}
export interface PointTransaction {
    id: string;
    customerId: string;
    type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'adjustment';
    points: number;
    description: string;
    source: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    expiresAt?: Date;
}
export declare class LoyaltyProgramService {
    private db;
    private notificationService;
    constructor();
    /**
     * Get customer loyalty status
     */
    getCustomerLoyalty(customerId: string): Promise<CustomerLoyalty & {
        currentTierInfo: LoyaltyTier;
        nextTierInfo?: LoyaltyTier;
        recentTransactions: PointTransaction[];
        availableRewards: LoyaltyReward[];
        expiringPoints: number;
    }>;
    /**
     * Award points for booking
     */
    awardPointsForBooking(bookingId: string, customerId: string, amount: number): Promise<void>;
    /**
     * Redeem reward
     */
    redeemReward(customerId: string, rewardId: string): Promise<{
        success: boolean;
        redemptionId: string;
        reward: LoyaltyReward;
        remainingPoints: number;
    }>;
    /**
     * Get loyalty tiers
     */
    getLoyaltyTiers(): Promise<LoyaltyTier[]>;
    /**
     * Get available rewards for customer
     */
    getAvailableRewards(tierLevel: string, currentPoints: number): Promise<LoyaltyReward[]>;
    /**
     * Get customer redemption history
     */
    getRedemptionHistory(customerId: string): Promise<Array<{
        id: string;
        rewardId: string;
        pointsCost: number;
        status: string;
        redeemedAt: Date;
        expiresAt: Date;
        usageCount: number;
        maxUsages: number;
    }>>;
    /**
     * Check daily login bonus
     */
    checkDailyLoginBonus(customerId: string): Promise<number>;
    /**
     * Initialize customer loyalty
     */
    private initializeCustomerLoyalty;
    /**
     * Güvenli Date/Timestamp dönüşümü
     */
    private toDateSafe;
    /**
     * Get or create customer loyalty
     */
    private getOrCreateCustomerLoyalty;
    /**
     * Add point transaction
     */
    private addPointTransaction;
    /**
     * Check for tier upgrade
     */
    private checkTierUpgrade;
    /**
     * Check for achievements
     */
    private checkAchievements;
    /**
     * Get recent point transactions
     */
    private getRecentPointTransactions;
    /**
     * Get expiring points
     */
    private getExpiringPoints;
    /**
     * Helper methods
     */
    private getCustomerTier;
    private getReward;
    private isSameDay;
    private isConsecutiveDay;
}
//# sourceMappingURL=loyaltyProgramService.d.ts.map