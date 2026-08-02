/**
 * Event Constants
 */
export const EVENTS = {
    // App lifecycle
    APP_READY: 'app:ready',
    APP_ERROR: 'app:error',
    
    // Cart events
    CART_UPDATED: 'cart:updated',
    CART_ITEM_ADDED: 'cart:item:added',
    CART_ITEM_REMOVED: 'cart:item:removed',
    CART_CLEARED: 'cart:cleared',
    
    // Product events
    PRODUCTS_LOADED: 'products:loaded',
    PRODUCTS_FILTERED: 'products:filtered',
    PRODUCT_SELECTED: 'product:selected',
    
    // Checkout events
    CHECKOUT_STARTED: 'checkout:started',
    CHECKOUT_COMPLETED: 'checkout:completed',
    CHECKOUT_FAILED: 'checkout:failed',
    
    // UI events
    MODAL_OPENED: 'modal:opened',
    MODAL_CLOSED: 'modal:closed',
    DRAWER_OPENED: 'drawer:opened',
    DRAWER_CLOSED: 'drawer:closed',
    TOAST_SHOWN: 'toast:shown',
    TOAST_DISMISSED: 'toast:dismissed',
    
    // Navigation events
    NAVIGATION_CHANGED: 'navigation:changed',
    SECTION_VISIBLE: 'section:visible',
};