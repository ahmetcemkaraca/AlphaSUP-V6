/**
 * Advanced Search and Filtering Service
 * Elasticsearch-like search capabilities for Firestore
 */
export interface SearchQuery {
    q?: string;
    filters?: SearchFilter[];
    sort?: SortOption[];
    page?: number;
    limit?: number;
    facets?: string[];
    highlight?: boolean;
    fuzzy?: boolean;
    boost?: Record<string, number>;
}
export interface SearchFilter {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not-in' | 'contains' | 'starts-with' | 'range' | 'exists' | 'regex';
    value: any;
    boost?: number;
}
export interface SortOption {
    field: string;
    direction: 'asc' | 'desc';
}
export interface SearchResult<T> {
    hits: Array<{
        id: string;
        data: T;
        score: number;
        highlights?: Record<string, string[]> | undefined;
    }>;
    totalCount: number;
    page: number;
    totalPages: number;
    facets?: Record<string, FacetResult> | undefined;
    executionTime: number;
    query: SearchQuery;
}
export interface FacetResult {
    buckets: Array<{
        key: string;
        count: number;
        selected?: boolean;
    }>;
    total: number;
}
export declare class AdvancedSearchService {
    private db;
    constructor();
    /**
     * Search customers with advanced filtering
     */
    searchCustomers(query: SearchQuery): Promise<SearchResult<any>>;
    /**
     * Search bookings with advanced filtering
     */
    searchBookings(query: SearchQuery): Promise<SearchResult<any>>;
    /**
     * Search services with advanced filtering
     */
    searchServices(query: SearchQuery): Promise<SearchResult<any>>;
    /**
     * Global search across all entities
     */
    globalSearch(query: SearchQuery): Promise<Record<string, SearchResult<any>>>;
    /**
     * Apply filters to Firestore query
     */
    private applyFilters;
    /**
     * Apply sorting to Firestore query
     */
    private applySorting;
    /**
     * Calculate relevance score for search results
     */
    private calculateScore;
    /**
     * Generate highlights for search results
     */
    private generateHighlights;
    /**
     * Get approximate total count for pagination
     */
    private getTotalCount;
    /**
     * Generate facets for search results
     */
    private generateFacets;
}
//# sourceMappingURL=advancedSearchService.d.ts.map