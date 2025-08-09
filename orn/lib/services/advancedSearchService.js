"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedSearchService = void 0;
const tslib_1 = require("tslib");
const admin = tslib_1.__importStar(require("firebase-admin"));
class AdvancedSearchService {
    constructor() {
        this.db = admin.firestore();
    }
    /**
     * Search customers with advanced filtering
     */
    async searchCustomers(query) {
        const startTime = Date.now();
        let firestoreQuery = this.db.collection('customers');
        // Apply filters
        firestoreQuery = this.applyFilters(firestoreQuery, query.filters || []);
        // Apply sorting
        firestoreQuery = this.applySorting(firestoreQuery, query.sort || []);
        // Apply pagination
        const page = query.page || 1;
        const limit = Math.min(query.limit || 20, 100);
        const offset = (page - 1) * limit;
        if (offset > 0) {
            firestoreQuery = firestoreQuery.offset(offset);
        }
        firestoreQuery = firestoreQuery.limit(limit + 1); // +1 to check if there are more results
        // Execute query
        const snapshot = await firestoreQuery.get();
        // Process results
        const hits = [];
        const docs = snapshot.docs.slice(0, limit);
        for (const doc of docs) {
            const data = doc.data();
            const score = this.calculateScore(data, query);
            const highlights = query.highlight ? this.generateHighlights(data, query.q) : undefined;
            hits.push({
                id: doc.id,
                data,
                score,
                highlights
            });
        }
        // Sort by score if full-text search is used
        if (query.q) {
            hits.sort((a, b) => b.score - a.score);
        }
        // Get total count (approximate)
        const totalCount = await this.getTotalCount('customers', query.filters || []);
        // Generate facets
        const facets = query.facets ? await this.generateFacets('customers', query.facets, query.filters || []) : undefined;
        return {
            hits,
            totalCount,
            page,
            totalPages: Math.ceil(totalCount / limit),
            facets,
            executionTime: Date.now() - startTime,
            query
        };
    }
    /**
     * Search bookings with advanced filtering
     */
    async searchBookings(query) {
        const startTime = Date.now();
        let firestoreQuery = this.db.collection('bookings');
        // Apply filters
        firestoreQuery = this.applyFilters(firestoreQuery, query.filters || []);
        // Apply sorting
        firestoreQuery = this.applySorting(firestoreQuery, query.sort || []);
        // Apply pagination
        const page = query.page || 1;
        const limit = Math.min(query.limit || 20, 100);
        const offset = (page - 1) * limit;
        if (offset > 0) {
            firestoreQuery = firestoreQuery.offset(offset);
        }
        firestoreQuery = firestoreQuery.limit(limit + 1);
        // Execute query
        const snapshot = await firestoreQuery.get();
        // Process results
        const hits = [];
        const docs = snapshot.docs.slice(0, limit);
        for (const doc of docs) {
            const data = doc.data();
            const score = this.calculateScore(data, query);
            const highlights = query.highlight ? this.generateHighlights(data, query.q) : undefined;
            hits.push({
                id: doc.id,
                data: {
                    ...data,
                    bookingDate: data['bookingDate']?.toDate(),
                    createdAt: data['createdAt']?.toDate(),
                    updatedAt: data['updatedAt']?.toDate()
                },
                score,
                highlights
            });
        }
        // Sort by score if full-text search is used
        if (query.q) {
            hits.sort((a, b) => b.score - a.score);
        }
        const totalCount = await this.getTotalCount('bookings', query.filters || []);
        const facets = query.facets ? await this.generateFacets('bookings', query.facets, query.filters || []) : undefined;
        return {
            hits,
            totalCount,
            page,
            totalPages: Math.ceil(totalCount / limit),
            facets,
            executionTime: Date.now() - startTime,
            query
        };
    }
    /**
     * Search services with advanced filtering
     */
    async searchServices(query) {
        const startTime = Date.now();
        let firestoreQuery = this.db.collection('services');
        // Apply filters
        firestoreQuery = this.applyFilters(firestoreQuery, query.filters || []);
        // Apply sorting
        firestoreQuery = this.applySorting(firestoreQuery, query.sort || []);
        // Apply pagination
        const page = query.page || 1;
        const limit = Math.min(query.limit || 20, 100);
        const offset = (page - 1) * limit;
        if (offset > 0) {
            firestoreQuery = firestoreQuery.offset(offset);
        }
        firestoreQuery = firestoreQuery.limit(limit + 1);
        const snapshot = await firestoreQuery.get();
        // Process results
        const hits = [];
        const docs = snapshot.docs.slice(0, limit);
        for (const doc of docs) {
            const data = doc.data();
            const score = this.calculateScore(data, query);
            const highlights = query.highlight ? this.generateHighlights(data, query.q) : undefined;
            hits.push({
                id: doc.id,
                data,
                score,
                highlights
            });
        }
        if (query.q) {
            hits.sort((a, b) => b.score - a.score);
        }
        const totalCount = await this.getTotalCount('services', query.filters || []);
        const facets = query.facets ? await this.generateFacets('services', query.facets, query.filters || []) : undefined;
        return {
            hits,
            totalCount,
            page,
            totalPages: Math.ceil(totalCount / limit),
            facets,
            executionTime: Date.now() - startTime,
            query
        };
    }
    /**
     * Global search across all entities
     */
    async globalSearch(query) {
        const [customers, bookings, services] = await Promise.all([
            this.searchCustomers({ ...query, limit: 10 }),
            this.searchBookings({ ...query, limit: 10 }),
            this.searchServices({ ...query, limit: 10 })
        ]);
        return {
            customers,
            bookings,
            services
        };
    }
    /**
     * Apply filters to Firestore query
     */
    applyFilters(query, filters) {
        let resultQuery = query;
        for (const filter of filters) {
            switch (filter.operator) {
                case 'eq':
                    resultQuery = resultQuery.where(filter.field, '==', filter.value);
                    break;
                case 'ne':
                    resultQuery = resultQuery.where(filter.field, '!=', filter.value);
                    break;
                case 'gt':
                    resultQuery = resultQuery.where(filter.field, '>', filter.value);
                    break;
                case 'gte':
                    resultQuery = resultQuery.where(filter.field, '>=', filter.value);
                    break;
                case 'lt':
                    resultQuery = resultQuery.where(filter.field, '<', filter.value);
                    break;
                case 'lte':
                    resultQuery = resultQuery.where(filter.field, '<=', filter.value);
                    break;
                case 'in':
                    resultQuery = resultQuery.where(filter.field, 'in', filter.value);
                    break;
                case 'not-in':
                    resultQuery = resultQuery.where(filter.field, 'not-in', filter.value);
                    break;
                case 'contains':
                    // Firestore doesn't support contains, use >= and < for string prefix
                    if (typeof filter.value === 'string') {
                        query = query.where(filter.field, '>=', filter.value)
                            .where(filter.field, '<', filter.value + '\uf8ff');
                    }
                    break;
                case 'starts-with':
                    if (typeof filter.value === 'string') {
                        query = query.where(filter.field, '>=', filter.value)
                            .where(filter.field, '<', filter.value + '\uf8ff');
                    }
                    break;
                case 'range':
                    if (Array.isArray(filter.value) && filter.value.length === 2) {
                        query = query.where(filter.field, '>=', filter.value[0])
                            .where(filter.field, '<=', filter.value[1]);
                    }
                    break;
                // Note: 'exists' and 'regex' are not directly supported by Firestore
                // These would need to be handled in post-processing
            }
        }
        return query;
    }
    /**
     * Apply sorting to Firestore query
     */
    applySorting(query, sorts) {
        let resultQuery = query;
        for (const sort of sorts) {
            resultQuery = resultQuery.orderBy(sort.field, sort.direction);
        }
        return resultQuery;
    }
    /**
     * Calculate relevance score for search results
     */
    calculateScore(data, query) {
        let score = 1.0;
        if (!query.q)
            return score;
        const searchTerms = query.q.toLowerCase().split(' ');
        const searchableFields = ['name', 'email', 'phone', 'description', 'title', 'notes'];
        for (const field of searchableFields) {
            if (data[field]) {
                const fieldValue = String(data[field]).toLowerCase();
                const fieldBoost = query.boost?.[field] || 1.0;
                for (const term of searchTerms) {
                    if (fieldValue.includes(term)) {
                        // Exact match gets higher score
                        if (fieldValue === term) {
                            score += 3.0 * fieldBoost;
                        }
                        // Starts with gets medium score
                        else if (fieldValue.startsWith(term)) {
                            score += 2.0 * fieldBoost;
                        }
                        // Contains gets base score
                        else {
                            score += 1.0 * fieldBoost;
                        }
                    }
                }
            }
        }
        return score;
    }
    /**
     * Generate highlights for search results
     */
    generateHighlights(data, searchQuery) {
        if (!searchQuery)
            return undefined;
        const highlights = {};
        const searchTerms = searchQuery.toLowerCase().split(' ');
        const highlightableFields = ['name', 'email', 'description', 'notes'];
        for (const field of highlightableFields) {
            if (data[field]) {
                const fieldValue = String(data[field]);
                const fieldLower = fieldValue.toLowerCase();
                for (const term of searchTerms) {
                    if (fieldLower.includes(term)) {
                        const regex = new RegExp(`(${term})`, 'gi');
                        const highlighted = fieldValue.replace(regex, '<mark>$1</mark>');
                        if (!highlights[field]) {
                            highlights[field] = [];
                        }
                        highlights[field].push(highlighted);
                    }
                }
            }
        }
        return Object.keys(highlights).length > 0 ? highlights : undefined;
    }
    /**
     * Get approximate total count for pagination
     */
    async getTotalCount(collection, filters) {
        try {
            let query = this.db.collection(collection);
            query = this.applyFilters(query, filters);
            const countSnapshot = await query.count().get();
            return countSnapshot.data().count;
        }
        catch (error) {
            // Fallback: count documents manually (less efficient)
            let query = this.db.collection(collection);
            query = this.applyFilters(query, filters);
            const snapshot = await query.get();
            return snapshot.size;
        }
    }
    /**
     * Generate facets for search results
     */
    async generateFacets(collection, facetFields, filters) {
        const facets = {};
        for (const field of facetFields) {
            try {
                // Get unique values for this field
                let query = this.db.collection(collection);
                // Apply filters except for the current facet field
                const otherFilters = filters.filter(f => f.field !== field);
                query = this.applyFilters(query, otherFilters);
                const snapshot = await query.get();
                const valueCounts = {};
                snapshot.docs.forEach(doc => {
                    const value = doc.data()[field];
                    if (value !== undefined && value !== null) {
                        const key = String(value);
                        valueCounts[key] = (valueCounts[key] || 0) + 1;
                    }
                });
                const buckets = Object.entries(valueCounts)
                    .map(([key, count]) => ({
                    key,
                    count,
                    selected: filters.some(f => f.field === field && f.value === key)
                }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 20); // Limit to top 20 facets
                facets[field] = {
                    buckets,
                    total: buckets.reduce((sum, bucket) => sum + bucket.count, 0)
                };
            }
            catch (error) {
                console.error(`Error generating facet for field ${field}:`, error);
            }
        }
        return facets;
    }
}
exports.AdvancedSearchService = AdvancedSearchService;
//# sourceMappingURL=advancedSearchService.js.map