/**
 * Products Repository - Data access layer for products
 * 
 * Single Responsibility: Only handles product data fetching
 */
import { BaseRepository } from '../../shared/repositories/base.repository.js';
import { storage } from '../../shared/services/storage.service.js';
import { Product } from '../../shared/models/product.model.js';

const PRODUCTS_KEY = 'products';

export class ProductsRepository extends BaseRepository {
    constructor() {
        super(storage, PRODUCTS_KEY);
        this.model = Product;
    }
    
    /**
     * Get all products from config or storage
     */
    findAll() {
        // Try storage first
        const stored = this.storage.get(this.key);
        if (stored && stored.length > 0) {
            return stored.map(p => this.model.fromJSON(p));
        }
        
        // Fallback to config
        const configProducts = window.products || [];
        if (configProducts.length > 0) {
            this.storage.set(this.key, configProducts);
            return configProducts.map(p => this.model.fromJSON(p));
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