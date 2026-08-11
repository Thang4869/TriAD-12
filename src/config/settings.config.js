export const APP_CONFIG = {
    ITEMS_PER_PAGE: 12,
    LOAD_MORE_INCREMENT: 12,
    TOAST_DURATION: 3000,
    MAX_TOASTS: 4,
    FLY_DURATION: 800,
    STORAGE_KEYS: {
        CART: 'aura_cart',
        FILTERS: 'aura_filters',
        CHECKOUT: 'aura_checkout'
    },
    MIN_ORDER_AMOUNT: 0,
    SHIPPING_FEE: 30000,
    FREE_SHIPPING_THRESHOLD: 500000,
    API_BASE_URL: '/api',
    PLACEHOLDER_IMAGE: 'https://via.placeholder.com/400x400/cccccc/ffffff?text=No+Image'
};

window.APP_CONFIG = APP_CONFIG;