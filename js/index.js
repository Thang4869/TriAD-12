import { loadComponents } from './utils/loader.js';
import './config/products.js';
import './config/settings.js';
import './utils/dom.js';
import './utils/storage.js';
import './utils/helpers.js';
import './core/toast.js';
import './core/fly-to-cart.js';
import './core/cart.js';
import './core/drawer.js';
import './core/modal.js';
import './core/filters.js';
import './core/checkout.js';
import './core/header.js';
import './core/scroll-reveal.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Loading components...');
    
    try {
        // 1. Load HTML components
        await loadComponents([
            { elementId: 'header-container', filePath: 'pages/header.html' },
            { elementId: 'hero-container', filePath: 'pages/hero.html' },
            { elementId: 'about-container', filePath: 'pages/about.html' },
            { elementId: 'products-container', filePath: 'pages/products.html' },
            { elementId: 'features-container', filePath: 'pages/features.html' },
            { elementId: 'footer-container', filePath: 'pages/footer.html' },
            { elementId: 'cart-drawer-container', filePath: 'pages/cart-drawer.html' },
            { elementId: 'product-modal-container', filePath: 'pages/product-modal.html' },
            { elementId: 'checkout-modal-container', filePath: 'pages/checkout-modal.html' },
            { elementId: 'success-modal-container', filePath: 'pages/success-modal.html' }
        ]);
        
        console.log('All components loaded!');
        
        // 2. Khởi tạo app
        const { initApp } = await import('./app.js');
        initApp();
        
        // 3. Khởi tạo header (sau khi header đã load)
        setTimeout(() => {
            if (window.initHeaderScroll) {
                console.log('Starting header...');
                window.initHeaderScroll();
            }
        }, 100);
        
        // 4. Khởi tạo scroll reveal (sau khi products đã load)
        setTimeout(() => {
            if (window.initScrollReveal) {
                console.log('Starting scroll reveal...');
                window.initScrollReveal();
            }
        }, 400);
        
    } catch (error) {
        console.error('Error:', error);
    }
});
