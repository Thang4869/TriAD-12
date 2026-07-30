// config/settings.js

export const APP_CONFIG = {
    // Pagination
    ITEMS_PER_PAGE: 12,
    LOAD_MORE_INCREMENT: 12,
    
    // Toast
    TOAST_DURATION: 3000,
    MAX_TOASTS: 4,
    
    // Animation
    FLY_DURATION: 800,
    
    // Storage keys
    STORAGE_KEYS: {
        CART: 'aura_cart',
        FILTERS: 'aura_filters',
        CHECKOUT: 'aura_checkout'
    },
    
    // Checkout
    MIN_ORDER_AMOUNT: 0,
    SHIPPING_FEE: 30000,
    FREE_SHIPPING_THRESHOLD: 500000,
    
    // API (simulated)
    API_BASE_URL: '/api',
    
    // Product image placeholder
    PLACEHOLDER_IMAGE: 'https://via.placeholder.com/400x400/cccccc/ffffff?text=No+Image'
};

window.APP_CONFIG = APP_CONFIG;