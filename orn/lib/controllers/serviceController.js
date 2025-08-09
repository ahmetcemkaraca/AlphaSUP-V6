"use strict";
/**
 * Service Controller
 * Handles customer-facing service operations
 * Enhanced with comprehensive service management
 *
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServicePricing = exports.getServiceAvailability = exports.searchServices = exports.getServiceCategories = exports.getFeaturedServices = exports.getServiceById = exports.getServices = void 0;
const firebase_1 = require("../config/firebase");
// Simple validation functions
const validateServiceId = (id) => {
    if (!id || typeof id !== 'string') {
        return { isValid: false, error: 'Servis ID gereklidir' };
    }
    const trimmedId = id.trim();
    if (trimmedId.length === 0) {
        return { isValid: false, error: 'Servis ID boş olamaz' };
    }
    return { isValid: true };
};
const validateServiceSearchParams = (params) => {
    const errors = [];
    const cleanedParams = {};
    // Basic query validation
    if (params.q || params.query) {
        const query = (params.q || params.query).toString().trim();
        if (query.length >= 2 && query.length <= 100) {
            cleanedParams.query = query;
        }
        else if (query.length > 0) {
            errors.push('Arama terimi 2-100 karakter arası olmalıdır');
        }
    }
    // Simple filters
    if (params.category)
        cleanedParams.category = params.category.toString().trim();
    if (params.type)
        cleanedParams.type = params.type.toString().toLowerCase();
    if (params.minPrice && !isNaN(parseFloat(params.minPrice)))
        cleanedParams.minPrice = parseFloat(params.minPrice);
    if (params.maxPrice && !isNaN(parseFloat(params.maxPrice)))
        cleanedParams.maxPrice = parseFloat(params.maxPrice);
    if (params.sortBy)
        cleanedParams.sortBy = params.sortBy.toString();
    if (params.sortOrder === 'asc' || params.sortOrder === 'desc')
        cleanedParams.sortOrder = params.sortOrder;
    if (params.page && !isNaN(parseInt(params.page)) && parseInt(params.page) > 0)
        cleanedParams.page = parseInt(params.page);
    if (params.limit && !isNaN(parseInt(params.limit)) && parseInt(params.limit) > 0)
        cleanedParams.limit = Math.min(parseInt(params.limit), 100);
    return { isValid: errors.length === 0, errors, cleanedParams };
};
/**
 * Get all available services with advanced filtering
 * GET /api/v1/services
 */
const getServices = async (req, res, next) => {
    try {
        // Validate and clean query parameters
        const validation = validateServiceSearchParams(req.query);
        if (!validation.isValid) {
            res.status(400).json({
                success: false,
                error: 'Geçersiz arama parametreleri',
                details: validation.errors
            });
            return;
        }
        const { cleanedParams } = validation;
        let query = firebase_1.db.collection('services').where('isActive', '==', true);
        // Apply filters
        if (cleanedParams.category) {
            query = query.where('category', '==', cleanedParams.category);
        }
        if (cleanedParams.type) {
            query = query.where('type', '==', cleanedParams.type);
        }
        // Get documents
        const snapshot = await query.get();
        let services = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Apply text search filter
        if (cleanedParams.query) {
            const searchTerm = cleanedParams.query.toLowerCase();
            services = services.filter(service => {
                const name = (service.name || '').toLowerCase();
                const description = (service.description || '').toLowerCase();
                const tags = (service.tags || []).join(' ').toLowerCase();
                return name.includes(searchTerm) ||
                    description.includes(searchTerm) ||
                    tags.includes(searchTerm);
            });
        }
        // Apply price filters
        if (cleanedParams.minPrice !== undefined) {
            services = services.filter(service => service.pricing && service.pricing.basePrice >= cleanedParams.minPrice);
        }
        if (cleanedParams.maxPrice !== undefined) {
            services = services.filter(service => service.pricing && service.pricing.basePrice <= cleanedParams.maxPrice);
        }
        // Apply duration filter
        if (cleanedParams.duration !== undefined) {
            services = services.filter(service => service.duration <= cleanedParams.duration);
        }
        // Apply capacity filter
        if (cleanedParams.capacity !== undefined) {
            services = services.filter(service => service.maxCapacity >= cleanedParams.capacity);
        }
        // Apply difficulty filter
        if (cleanedParams.difficulty) {
            services = services.filter(service => service.difficulty === cleanedParams.difficulty);
        }
        // Apply location filter
        if (cleanedParams.location) {
            const locationTerm = cleanedParams.location.toLowerCase();
            services = services.filter(service => (service.location || '').toLowerCase().includes(locationTerm));
        }
        // Apply sorting
        if (cleanedParams.sortBy) {
            services.sort((a, b) => {
                let aValue, bValue;
                switch (cleanedParams.sortBy) {
                    case 'name':
                        aValue = a.name || '';
                        bValue = b.name || '';
                        break;
                    case 'price':
                        aValue = a.pricing?.basePrice || 0;
                        bValue = b.pricing?.basePrice || 0;
                        break;
                    case 'duration':
                        aValue = a.duration || 0;
                        bValue = b.duration || 0;
                        break;
                    case 'rating':
                        aValue = a['averageRating'] || 0;
                        bValue = b['averageRating'] || 0;
                        break;
                    case 'popularity':
                        aValue = a['totalBookings'] || 0;
                        bValue = b['totalBookings'] || 0;
                        break;
                    case 'createdAt':
                        aValue = new Date(a.createdAt || 0);
                        bValue = new Date(b.createdAt || 0);
                        break;
                    default:
                        aValue = a.name || '';
                        bValue = b.name || '';
                }
                if (cleanedParams.sortOrder === 'desc') {
                    return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
                }
                else {
                    return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
                }
            });
        }
        // Apply pagination
        const page = cleanedParams.page || 1;
        const limit = cleanedParams.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedServices = services.slice(startIndex, endIndex);
        res.json({
            success: true,
            data: {
                services: paginatedServices,
                pagination: {
                    page,
                    limit,
                    total: services.length,
                    totalPages: Math.ceil(services.length / limit),
                    hasNextPage: endIndex < services.length,
                    hasPrevPage: page > 1
                },
                filters: cleanedParams
            }
        });
    }
    catch (error) {
        console.error('Error getting services:', error);
        next(error);
    }
};
exports.getServices = getServices;
/**
 * Get service by ID with enhanced data
 * GET /api/v1/services/:id
 */
const getServiceById = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Validate service ID
        if (!id) {
            res.status(400).json({
                success: false,
                error: 'Servis ID gereklidir'
            });
            return;
        }
        const idValidation = validateServiceId(id);
        if (!idValidation.isValid) {
            res.status(400).json({
                success: false,
                error: idValidation.error
            });
            return;
        }
        const serviceDoc = await firebase_1.db.collection('services').doc(id).get();
        if (!serviceDoc.exists) {
            res.status(404).json({
                success: false,
                error: 'Servis bulunamadı'
            });
            return;
        }
        const serviceData = serviceDoc.data();
        // Check if service is active
        if (!serviceData.isActive) {
            res.status(404).json({
                success: false,
                error: 'Servis artık mevcut değil'
            });
            return;
        }
        // Get related services (same category, excluding current service)
        const relatedSnapshot = await firebase_1.db
            .collection('services')
            .where('isActive', '==', true)
            .where('category', '==', serviceData.category)
            .limit(5)
            .get();
        const relatedServices = relatedSnapshot.docs
            .filter(doc => doc.id !== id)
            .map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data['name'],
                shortDescription: data['shortDescription'],
                pricing: data['pricing'],
                duration: data['duration'],
                images: data['images']?.[0] || null
            };
        })
            .slice(0, 4);
        // Get recent reviews/ratings (placeholder for now)
        const recentReviews = [
            {
                id: '1',
                customerName: 'Ahmet K.',
                rating: 5,
                comment: 'Harika bir deneyimdi!',
                date: '2025-01-20'
            }
        ];
        res.json({
            success: true,
            data: {
                service: {
                    ...serviceData,
                    id: serviceDoc.id
                },
                relatedServices,
                recentReviews,
                metadata: {
                    totalBookings: serviceData['totalBookings'] || 0,
                    averageRating: serviceData['averageRating'] || 0,
                    totalReviews: serviceData['totalReviews'] || 0,
                    lastBooked: serviceData['lastBooked'] || null
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting service by ID:', error);
        next(error);
    }
};
exports.getServiceById = getServiceById;
/**
 * Get featured services
 */
const getFeaturedServices = async (req, res, next) => {
    try {
        const snapshot = await firebase_1.db
            .collection('services')
            .where('isActive', '==', true)
            .where('isFeatured', '==', true)
            .limit(6)
            .get();
        const services = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json({ success: true, data: { services } });
    }
    catch (error) {
        console.error('Error getting featured services:', error);
        next(error);
    }
};
exports.getFeaturedServices = getFeaturedServices;
/**
 * Get service categories
 */
const getServiceCategories = async (req, res, next) => {
    try {
        const snapshot = await firebase_1.db.collection('services').where('isActive', '==', true).get();
        const categories = new Map();
        snapshot.docs.forEach(doc => {
            const service = doc.data();
            const category = service.category;
            if (category) {
                const existing = categories.get(category);
                if (existing) {
                    categories.set(category, { ...existing, count: existing.count + 1 });
                }
                else {
                    categories.set(category, { name: service.categoryName || category, count: 1 });
                }
            }
        });
        const categoryList = Array.from(categories.entries()).map(([id, data]) => ({ id, ...data }));
        res.json({ success: true, data: { categories: categoryList } });
    }
    catch (error) {
        console.error('Error getting service categories:', error);
        next(error);
    }
};
exports.getServiceCategories = getServiceCategories;
/**
 * Search services with enhanced filtering
 */
const searchServices = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            res.status(400).json({
                success: false,
                error: 'Arama terimi en az 2 karakter olmalıdır'
            });
            return;
        }
        const searchTerm = q.toLowerCase().trim();
        // Get all active services
        const snapshot = await firebase_1.db.collection('services').where('isActive', '==', true).get();
        // Filter services based on search term
        const services = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(service => {
            const name = (service.name || '').toLowerCase();
            const description = (service.description || '').toLowerCase();
            const category = (service.category || '').toLowerCase();
            const categoryName = (service.categoryName || '').toLowerCase();
            const tags = (service.tags || []).join(' ').toLowerCase();
            const location = (service.location || '').toLowerCase();
            return name.includes(searchTerm) ||
                description.includes(searchTerm) ||
                category.includes(searchTerm) ||
                categoryName.includes(searchTerm) ||
                tags.includes(searchTerm) ||
                location.includes(searchTerm);
        })
            .map(service => {
            // Calculate relevance score
            const name = (service.name || '').toLowerCase();
            const description = (service.description || '').toLowerCase();
            let relevanceScore = 0;
            if (name.includes(searchTerm))
                relevanceScore += 10;
            if (name.startsWith(searchTerm))
                relevanceScore += 5;
            if (description.includes(searchTerm))
                relevanceScore += 3;
            if (service.isFeatured)
                relevanceScore += 2;
            return { ...service, relevanceScore };
        })
            .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by relevance
            .slice(0, 50); // Limit results
        // Get search suggestions (related terms)
        const suggestions = Array.from(new Set(services.flatMap(service => service.tags || [])
            .filter(tag => tag.toLowerCase().includes(searchTerm) && tag.toLowerCase() !== searchTerm)
            .slice(0, 5)));
        res.json({
            success: true,
            data: {
                services: services.map(({ relevanceScore, ...service }) => service), // Remove relevanceScore from response
                query: q,
                resultsCount: services.length,
                suggestions,
                searchMeta: {
                    totalResults: services.length,
                    searchTerm,
                    hasMoreResults: services.length === 50,
                    executionTime: Date.now()
                }
            }
        });
    }
    catch (error) {
        console.error('Error searching services:', error);
        next(error);
    }
};
exports.searchServices = searchServices;
/**
 * Get service availability with real-time booking data
 */
const getServiceAvailability = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { date } = req.query;
        if (!id || !date) {
            res.status(400).json({
                success: false,
                error: 'Servis ID ve tarih gereklidir'
            });
            return;
        }
        // Validate date format
        const dateStr = date;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateStr)) {
            res.status(400).json({
                success: false,
                error: 'Tarih YYYY-MM-DD formatında olmalıdır'
            });
            return;
        }
        const targetDate = new Date(dateStr);
        if (isNaN(targetDate.getTime())) {
            res.status(400).json({
                success: false,
                error: 'Geçersiz tarih'
            });
            return;
        }
        // Check if date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (targetDate < today) {
            res.status(400).json({
                success: false,
                error: 'Geçmiş tarih için rezervasyon yapılamaz'
            });
            return;
        }
        // Get service details
        const serviceDoc = await firebase_1.db.collection('services').doc(id).get();
        if (!serviceDoc.exists) {
            res.status(404).json({
                success: false,
                error: 'Servis bulunamadı'
            });
            return;
        }
        const service = serviceDoc.data();
        if (!service.isActive) {
            res.status(404).json({
                success: false,
                error: 'Servis aktif değil'
            });
            return;
        }
        // Get existing bookings for this date and service
        const bookingsSnapshot = await firebase_1.db
            .collection('bookings')
            .where('serviceId', '==', id)
            .where('date', '==', dateStr)
            .where('status', 'in', ['confirmed', 'pending'])
            .get();
        const bookedSlots = new Map();
        bookingsSnapshot.docs.forEach(doc => {
            const booking = doc.data();
            const timeSlot = booking['timeSlot'];
            const participants = booking['participantCount'] || 1;
            bookedSlots.set(timeSlot, (bookedSlots.get(timeSlot) || 0) + participants);
        });
        // Generate available time slots
        const availableSlots = [
            { time: '09:00', maxCapacity: service.maxCapacity },
            { time: '11:00', maxCapacity: service.maxCapacity },
            { time: '14:00', maxCapacity: service.maxCapacity },
            { time: '16:00', maxCapacity: service.maxCapacity }
        ].map(slot => {
            const booked = bookedSlots.get(slot.time) || 0;
            const available = Math.max(0, slot.maxCapacity - booked);
            return {
                time: slot.time,
                available: available > 0,
                capacity: slot.maxCapacity,
                bookedCapacity: booked,
                availableCapacity: available,
                price: service.pricing.basePrice || 0,
                isWeekend: targetDate.getDay() === 0 || targetDate.getDay() === 6,
                surcharge: (targetDate.getDay() === 0 || targetDate.getDay() === 6) ? (service.pricing.weekendSurcharge || 0) : 0
            };
        });
        // Calculate final prices with surcharges
        const slotsWithPricing = availableSlots.map(slot => ({
            ...slot,
            finalPrice: slot.price + slot.surcharge
        }));
        res.json({
            success: true,
            data: {
                date: dateStr,
                serviceId: id,
                serviceName: service.name,
                availableSlots: slotsWithPricing,
                totalSlots: slotsWithPricing.length,
                totalAvailableSlots: slotsWithPricing.filter(slot => slot.available).length,
                serviceInfo: {
                    duration: service.duration,
                    maxCapacity: service.maxCapacity,
                    difficulty: service.difficulty,
                    pricing: service.pricing
                },
                bookingInfo: {
                    advanceBookingRequired: true,
                    cancellationPolicy: '24 saat öncesine kadar ücretsiz iptal',
                    weatherDependent: true
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting service availability:', error);
        next(error);
    }
};
exports.getServiceAvailability = getServiceAvailability;
/**
 * Get service pricing with detailed breakdown
 */
const getServicePricing = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { participantCount = '1', date, duration } = req.query;
        if (!id) {
            res.status(400).json({
                success: false,
                error: 'Servis ID gereklidir'
            });
            return;
        }
        const participantCountNum = parseInt(participantCount, 10);
        if (isNaN(participantCountNum) || participantCountNum < 1 || participantCountNum > 50) {
            res.status(400).json({
                success: false,
                error: 'Katılımcı sayısı 1-50 arasında olmalıdır'
            });
            return;
        }
        const serviceDoc = await firebase_1.db.collection('services').doc(id).get();
        if (!serviceDoc.exists) {
            res.status(404).json({
                success: false,
                error: 'Servis bulunamadı'
            });
            return;
        }
        const service = serviceDoc.data();
        if (!service.isActive) {
            res.status(404).json({
                success: false,
                error: 'Servis aktif değil'
            });
            return;
        }
        const pricing = service.pricing || { basePrice: 100, currency: 'TRY' };
        // Base price calculation
        let finalPrice = pricing.basePrice;
        const priceBreakdown = {
            basePrice: pricing.basePrice,
            participantCount: participantCountNum
        };
        // Per person pricing
        if (participantCountNum > 1 && pricing.perPerson) {
            const additionalPersonsCost = pricing.perPerson * (participantCountNum - 1);
            finalPrice += additionalPersonsCost;
            priceBreakdown.additionalPersons = {
                count: participantCountNum - 1,
                pricePerPerson: pricing.perPerson,
                total: additionalPersonsCost
            };
        }
        // Duration-based pricing
        if (duration && pricing.perHour) {
            const durationHours = parseFloat(duration);
            if (!isNaN(durationHours) && durationHours > 0) {
                const durationCost = pricing.perHour * durationHours;
                finalPrice += durationCost;
                priceBreakdown.duration = {
                    hours: durationHours,
                    pricePerHour: pricing.perHour,
                    total: durationCost
                };
            }
        }
        // Weekend surcharge
        let weekendSurcharge = 0;
        if (date) {
            const bookingDate = new Date(date);
            if (!isNaN(bookingDate.getTime())) {
                const isWeekend = bookingDate.getDay() === 0 || bookingDate.getDay() === 6;
                if (isWeekend && pricing.weekendSurcharge) {
                    weekendSurcharge = pricing.weekendSurcharge;
                    finalPrice += weekendSurcharge;
                    priceBreakdown.weekendSurcharge = weekendSurcharge;
                }
            }
        }
        // Group discounts
        let groupDiscount = 0;
        if (participantCountNum >= 10) {
            groupDiscount = Math.round(finalPrice * 0.1); // 10% group discount
            finalPrice -= groupDiscount;
            priceBreakdown.groupDiscount = {
                reason: 'Grup indirimi (10+ kişi)',
                amount: groupDiscount,
                percentage: 10
            };
        }
        else if (participantCountNum >= 5) {
            groupDiscount = Math.round(finalPrice * 0.05); // 5% group discount
            finalPrice -= groupDiscount;
            priceBreakdown.groupDiscount = {
                reason: 'Grup indirimi (5+ kişi)',
                amount: groupDiscount,
                percentage: 5
            };
        }
        // Deposit calculation
        const depositPercentage = pricing.depositPercentage || 30;
        const depositAmount = Math.round(finalPrice * (depositPercentage / 100));
        const remainingAmount = finalPrice - depositAmount;
        // Tax calculation (18% KDV)
        const taxRate = 0.18;
        const taxAmount = Math.round(finalPrice * taxRate);
        const totalWithTax = finalPrice + taxAmount;
        res.json({
            success: true,
            data: {
                serviceId: id,
                serviceName: service.name,
                pricing: {
                    basePrice: pricing.basePrice,
                    finalPrice,
                    finalPriceWithTax: totalWithTax,
                    participantCount: participantCountNum,
                    deposit: {
                        amount: depositAmount,
                        percentage: depositPercentage
                    },
                    remaining: remainingAmount,
                    tax: {
                        amount: taxAmount,
                        rate: taxRate,
                        description: 'KDV (%18)'
                    },
                    currency: pricing.currency || 'TRY'
                },
                breakdown: priceBreakdown,
                discounts: groupDiscount > 0 ? [{
                        type: 'group',
                        description: `Grup indirimi (${participantCountNum} kişi)`,
                        amount: groupDiscount
                    }] : [],
                paymentOptions: {
                    fullPayment: totalWithTax,
                    depositPayment: depositAmount,
                    remainingPayment: remainingAmount,
                    installments: totalWithTax > 1000 ? [
                        { count: 2, amount: Math.round(totalWithTax / 2) },
                        { count: 3, amount: Math.round(totalWithTax / 3) }
                    ] : []
                },
                validityPeriod: {
                    hours: 24,
                    message: 'Bu fiyat 24 saat geçerlidir'
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting service pricing:', error);
        next(error);
    }
};
exports.getServicePricing = getServicePricing;
//# sourceMappingURL=serviceController.js.map