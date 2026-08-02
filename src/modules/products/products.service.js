/**
 * Products Service - Business logic for products
 * 
 * Single Responsibility: Filtering, sorting, pagination logic
 * Dependencies: ProductsRepository
 */
import { ProductsRepository } from './products.repository.js';
import { eventBus, EVENTS } from '../../shared/services/event-bus.service.js';

export class ProductsService {
    constructor() {
        this.repository = new ProductsRepository();
        this.products = [];
        this.filteredProducts = [];
        this.filters = this.getDefaultFilters();
        this.page = 1;
        this.pageSize = 12;
    }
    
    /**
     * Get default filter state
     */
    getDefaultFilters() {
        return {
            keyword: '',
            minPrice: 0,
            maxPrice: 499000,
            sort: 'default'
        };
    }
    
    /**
     * Load products from repository
     */
    load() {
        this.products = this.repository.findAll();
        this.filteredProducts = [...this.products];
        this.applyFilters();
        eventBus.emit(EVENTS.PRODUCTS_LOADED, { count: this.products.length });
        return this.filteredProducts;
    }
    
    /**
     * Apply all filters
     */
    applyFilters() {
        const { keyword, minPrice, maxPrice, sort } = this.filters;
        
        // Filter by keyword
        this.filteredProducts = this.products.filter(product => {
            const matchKeyword = !keyword || product.matchesKeyword(keyword);
            const matchPrice = product.matchesPriceRange(minPrice, maxPrice);
            return matchKeyword && matchPrice;
        });
        
        // Apply sort
        this.applySort(sort);
        
        // Reset page
        this.page = 1;
        
        eventBus.emit(EVENTS.PRODUCTS_FILTERED, {
            total: this.filteredProducts.length,
            filters: this.filters
        });
        
        return this.filteredProducts;
    }
    
    /**
     * Apply sorting
     */
    applySort(sort) {
        switch (sort) {
            case 'price-asc':
                this.filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                this.filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                this.filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
                break;
            default:
                // Default: keep original order
                break;
        }
    }
    
    /**
     * Get current page items
     */
    getCurrentPage() {
        const start = 0;
        const end = this.page * this.pageSize;
        return this.filteredProducts.slice(start, end);
    }
    
    /**
     * Check if there are more items to load
     */
    get hasMore() {
        return this.filteredProducts.length > this.page * this.pageSize;
    }
    
    /**
     * Load more items
     */
    loadMore() {
        if (!this.hasMore) return this.getCurrentPage();
        this.page++;
        return this.getCurrentPage();
    }
    
    /**
     * Get total count
     */
    get totalCount() {
        return this.filteredProducts.length;
    }
    
    /**
     * Update filters
     */
    updateFilters(newFilters) {
        this.filters = { ...this.filters, ...newFilters };
        this.applyFilters();
        return this.filteredProducts;
    }
    
    /**
     * Reset all filters
     */
    resetFilters() {
        this.filters = this.getDefaultFilters();
        this.applyFilters();
        return this.filteredProducts;
    }
    
    /**
     * Get product by ID
     */
    getProductById(id) {
        return this.repository.findById(id);
    }
}