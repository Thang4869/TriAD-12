// utils/storage.js
import { APP_CONFIG } from '../config/settings.js';

const { STORAGE_KEYS } = APP_CONFIG;

export function storageGet(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch {
        return defaultValue;
    }
}

export function storageSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

export function storageRemove(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}

export function getCartStorage() {
    return storageGet(STORAGE_KEYS.CART, []);
}

export function setCartStorage(cart) {
    storageSet(STORAGE_KEYS.CART, cart);
}

export function getFiltersStorage() {
    const defaultFilters = {
        keyword: '',
        minPrice: 0,
        maxPrice: 499000,
        sort: 'default'
    };
    return storageGet(STORAGE_KEYS.FILTERS, defaultFilters);
}

export function setFiltersStorage(filters) {
    storageSet(STORAGE_KEYS.FILTERS, filters);
}

// Expose for inline usage
window.storageGet = storageGet;
window.storageSet = storageSet;
window.storageRemove = storageRemove;
window.getCartStorage = getCartStorage;
window.setCartStorage = setCartStorage;
window.getFiltersStorage = getFiltersStorage;
window.setFiltersStorage = setFiltersStorage;