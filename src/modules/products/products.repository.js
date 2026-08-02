/**
 * Products Repository - Data access layer for products
 * 
 * Single Responsibility: Only handles product data fetching
 */
import { storage } from '../../shared/services/storage.service.js';
import { Product } from '../../shared/models/product.model.js';

const PRODUCTS_KEY = 'products';

export class ProductsRepository {
    constructor() {
        this.storage = storage;
    }
    
    /**
     * Get all products from config or storage
     */
    findAll() {
        // Try to get from storage first (for future dynamic updates)
        const stored = this.storage.get(PRODUCTS_KEY);
        if (stored && stored.length > 0) {
            return stored.map(p => Product.fromJSON(p));
        }
        
        // Fallback to window.products (from config)
        const configProducts = window.products || [];
        if (configProducts.length > 0) {
            // Cache to storage for future
            this.storage.set(PRODUCTS_KEY, configProducts);
            return configProducts.map(p => Product.fromJSON(p));
        }
        
        return [];
    }
    
    /**
     * Get product by ID
     */
    findById(id) {
        const products = this.findAll();
        return products.find(p => p.id === id) || null;
    }
    
    /**
     * Get products by IDs
     */
    findByIds(ids) {
        const products = this.findAll();
        return products.filter(p => ids.includes(p.id));
    }
    
    /**
     * Save products (for future admin features)
     */
    save(products) {
        const data = products.map(p => p.toJSON());
        this.storage.set(PRODUCTS_KEY, data);
    }
}