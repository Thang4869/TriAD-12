/**
 * Base Repository - Abstract class for data access
 * 
 * Provides common CRUD operations for all repositories
 */
export class BaseRepository {
    constructor(storage, key) {
        this.storage = storage;
        this.key = key;
        this.model = null; // Should be overridden
    }
    
    /**
     * Get all items
     */
    findAll() {
        const data = this.storage.get(this.key, []);
        return data.map(item => this.model.fromJSON(item));
    }
    
    /**
     * Find by ID
     */
    findById(id) {
        const items = this.findAll();
        return items.find(item => item.id === id) || null;
    }
    
    /**
     * Save all items
     */
    save(items) {
        const data = items.map(item => item.toJSON());
        this.storage.set(this.key, data);
    }
    
    /**
     * Clear all
     */
    clear() {
        this.storage.remove(this.key);
    }
    
    /**
     * Get count
     */
    count() {
        return this.findAll().length;
    }
}