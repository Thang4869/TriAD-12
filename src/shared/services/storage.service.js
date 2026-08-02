/**
 * Storage Service - Abstraction layer for data persistence
 * 
 * Design Pattern: Facade Pattern
 * Purpose: Hide complexity of localStorage operations
 * Future: Can be extended to support API, IndexedDB, etc.
 */
export class StorageService {
    constructor(prefix = 'aura_') {
        this.prefix = prefix;
        this.memory = new Map(); // Fallback when localStorage is not available
    }
    
    /**
     * Check if localStorage is available
     */
    isAvailable() {
        try {
            localStorage.setItem('_test_', 'test');
            localStorage.removeItem('_test_');
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Get item from storage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key not found
     * @returns {*} Parsed value
     */
    get(key, defaultValue = null) {
        const fullKey = this.prefix + key;
        
        if (this.isAvailable()) {
            try {
                const data = localStorage.getItem(fullKey);
                return data ? JSON.parse(data) : defaultValue;
            } catch (error) {
                console.warn(`[Storage] Error reading ${fullKey}:`, error);
                return defaultValue;
            }
        }
        
        // Fallback to memory
        return this.memory.has(fullKey) ? this.memory.get(fullKey) : defaultValue;
    }
    
    /**
     * Set item to storage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    set(key, value) {
        const fullKey = this.prefix + key;
        
        if (this.isAvailable()) {
            try {
                localStorage.setItem(fullKey, JSON.stringify(value));
                return true;
            } catch (error) {
                console.warn(`[Storage] Error writing ${fullKey}:`, error);
                // Fallback to memory
                this.memory.set(fullKey, value);
                return false;
            }
        }
        
        this.memory.set(fullKey, value);
        return true;
    }
    
    /**
     * Remove item from storage
     * @param {string} key - Storage key
     */
    remove(key) {
        const fullKey = this.prefix + key;
        
        if (this.isAvailable()) {
            try {
                localStorage.removeItem(fullKey);
            } catch (error) {
                console.warn(`[Storage] Error removing ${fullKey}:`, error);
            }
        }
        
        this.memory.delete(fullKey);
    }
    
    /**
     * Clear all items with prefix
     */
    clear() {
        if (this.isAvailable()) {
            try {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith(this.prefix)) {
                        localStorage.removeItem(key);
                    }
                });
            } catch (error) {
                console.warn('[Storage] Error clearing:', error);
            }
        }
        
        this.memory.clear();
    }
    
    /**
     * Get all keys with prefix
     * @returns {string[]} Array of keys (without prefix)
     */
    keys() {
        const result = [];
        
        if (this.isAvailable()) {
            try {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith(this.prefix)) {
                        result.push(key.substring(this.prefix.length));
                    }
                });
            } catch (error) {
                console.warn('[Storage] Error getting keys:', error);
            }
        }
        
        // Add memory keys
        this.memory.forEach((_, key) => {
            if (key.startsWith(this.prefix)) {
                const cleanKey = key.substring(this.prefix.length);
                if (!result.includes(cleanKey)) {
                    result.push(cleanKey);
                }
            }
        });
        
        return result;
    }
}

// Export singleton instance
export const storage = new StorageService();