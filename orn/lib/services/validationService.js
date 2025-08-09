"use strict";
/**
 * Validation Service
 * Input validation for API requests
 *
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParticipantCount = exports.validateDate = exports.validateServiceId = exports.validateServiceSearchParams = void 0;
/**
 * Validate service search parameters
 */
const validateServiceSearchParams = (params) => {
    const errors = [];
    const cleanedParams = {};
    // Query validation
    if (params.q || params.query) {
        const query = (params.q || params.query).toString().trim();
        if (query.length < 2) {
            errors.push('Arama terimi en az 2 karakter olmalıdır');
        }
        else if (query.length > 100) {
            errors.push('Arama terimi 100 karakterden fazla olamaz');
        }
        else {
            cleanedParams.query = query;
        }
    }
    // Category validation
    if (params.category) {
        const category = params.category.toString().trim();
        if (category.length > 0 && category.length <= 50) {
            cleanedParams.category = category;
        }
        else {
            errors.push('Geçersiz kategori');
        }
    }
    // Type validation
    if (params.type) {
        const validTypes = ['rental', 'guided_tour', 'lesson', 'package', 'custom'];
        const type = params.type.toString().toLowerCase();
        if (validTypes.includes(type)) {
            cleanedParams.type = type;
        }
        else {
            errors.push('Geçersiz servis türü');
        }
    }
    // Price validation
    if (params.minPrice) {
        const minPrice = parseFloat(params.minPrice);
        if (!isNaN(minPrice) && minPrice >= 0) {
            cleanedParams.minPrice = minPrice;
        }
        else {
            errors.push('Geçersiz minimum fiyat');
        }
    }
    if (params.maxPrice) {
        const maxPrice = parseFloat(params.maxPrice);
        if (!isNaN(maxPrice) && maxPrice >= 0) {
            cleanedParams.maxPrice = maxPrice;
        }
        else {
            errors.push('Geçersiz maksimum fiyat');
        }
    }
    // Date validation
    if (params.date) {
        const date = params.date.toString();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(date)) {
            const parsedDate = new Date(date);
            if (!isNaN(parsedDate.getTime())) {
                cleanedParams.date = date;
            }
            else {
                errors.push('Geçersiz tarih formatı');
            }
        }
        else {
            errors.push('Tarih YYYY-MM-DD formatında olmalıdır');
        }
    }
    // Duration validation
    if (params.duration) {
        const duration = parseInt(params.duration);
        if (!isNaN(duration) && duration > 0 && duration <= 1440) { // Max 24 hours
            cleanedParams.duration = duration;
        }
        else {
            errors.push('Geçersiz süre (1-1440 dakika arası)');
        }
    }
    // Capacity validation
    if (params.capacity) {
        const capacity = parseInt(params.capacity);
        if (!isNaN(capacity) && capacity > 0 && capacity <= 50) {
            cleanedParams.capacity = capacity;
        }
        else {
            errors.push('Geçersiz kapasite (1-50 arası)');
        }
    }
    // Difficulty validation
    if (params.difficulty) {
        const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
        const difficulty = params.difficulty.toString().toLowerCase();
        if (validDifficulties.includes(difficulty)) {
            cleanedParams.difficulty = difficulty;
        }
        else {
            errors.push('Geçersiz zorluk seviyesi');
        }
    }
    // Location validation
    if (params.location) {
        const location = params.location.toString().trim();
        if (location.length > 0 && location.length <= 100) {
            cleanedParams.location = location;
        }
        else {
            errors.push('Geçersiz lokasyon');
        }
    }
    // Sort validation
    if (params.sortBy) {
        const validSortFields = ['name', 'price', 'duration', 'rating', 'popularity', 'createdAt'];
        const sortBy = params.sortBy.toString().toLowerCase();
        if (validSortFields.includes(sortBy)) {
            cleanedParams.sortBy = sortBy;
        }
        else {
            errors.push('Geçersiz sıralama alanı');
        }
    }
    if (params.sortOrder) {
        const sortOrder = params.sortOrder.toString().toLowerCase();
        if (sortOrder === 'asc' || sortOrder === 'desc') {
            cleanedParams.sortOrder = sortOrder;
        }
        else {
            errors.push('Sıralama yönü asc veya desc olmalıdır');
        }
    }
    // Pagination validation
    if (params.page) {
        const page = parseInt(params.page);
        if (!isNaN(page) && page > 0) {
            cleanedParams.page = page;
        }
        else {
            errors.push('Geçersiz sayfa numarası');
        }
    }
    if (params.limit) {
        const limit = parseInt(params.limit);
        if (!isNaN(limit) && limit > 0 && limit <= 100) {
            cleanedParams.limit = limit;
        }
        else {
            errors.push('Geçersiz limit (1-100 arası)');
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
        cleanedParams
    };
};
exports.validateServiceSearchParams = validateServiceSearchParams;
/**
 * Validate service ID parameter
 */
const validateServiceId = (id) => {
    if (!id || typeof id !== 'string') {
        return { isValid: false, error: 'Servis ID gereklidir' };
    }
    const trimmedId = id.trim();
    if (trimmedId.length === 0) {
        return { isValid: false, error: 'Servis ID boş olamaz' };
    }
    if (trimmedId.length > 50) {
        return { isValid: false, error: 'Servis ID çok uzun' };
    }
    // Basic alphanumeric + hyphen validation
    const idRegex = /^[a-zA-Z0-9_-]+$/;
    if (!idRegex.test(trimmedId)) {
        return { isValid: false, error: 'Geçersiz servis ID formatı' };
    }
    return { isValid: true };
};
exports.validateServiceId = validateServiceId;
/**
 * Validate date parameter
 */
const validateDate = (date) => {
    if (!date || typeof date !== 'string') {
        return { isValid: false, error: 'Tarih gereklidir' };
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        return { isValid: false, error: 'Tarih YYYY-MM-DD formatında olmalıdır' };
    }
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
        return { isValid: false, error: 'Geçersiz tarih' };
    }
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDate < today) {
        return { isValid: false, error: 'Tarih geçmişte olamaz' };
    }
    // Check if date is too far in the future (1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (parsedDate > oneYearFromNow) {
        return { isValid: false, error: 'Tarih 1 yıldan fazla ileride olamaz' };
    }
    return { isValid: true, parsedDate };
};
exports.validateDate = validateDate;
/**
 * Validate participant count
 */
const validateParticipantCount = (count) => {
    const parsedCount = typeof count === 'string' ? parseInt(count, 10) : count;
    if (isNaN(parsedCount) || parsedCount < 1) {
        return { isValid: false, error: 'Katılımcı sayısı en az 1 olmalıdır' };
    }
    if (parsedCount > 50) {
        return { isValid: false, error: 'Katılımcı sayısı en fazla 50 olabilir' };
    }
    return { isValid: true, count: parsedCount };
};
exports.validateParticipantCount = validateParticipantCount;
//# sourceMappingURL=validationService.js.map