/**
 * Bootstrap - Application entry point
 * 
 * Responsible for loading HTML components and starting the app
 */
import { loadComponents } from '../shared/utils/loader.utils.js';
import { App } from './app.js';

export async function bootstrap() {
    console.log('📦 Bootstrapping TriAD Application...');
    
    try {
        // 1. Load HTML components
        await loadComponents([
            { elementId: 'header-container', filePath: './pages/header.html' },
            { elementId: 'hero-container', filePath: './pages/hero.html' },
            { elementId: 'about-container', filePath: './pages/about.html' },
            { elementId: 'products-container', filePath: './pages/products.html' },
            { elementId: 'features-container', filePath: './pages/features.html' },
            { elementId: 'footer-container', filePath: './pages/footer.html' },
            { elementId: 'cart-drawer-container', filePath: './pages/cart-drawer.html' },
            { elementId: 'product-modal-container', filePath: './pages/product-modal.html' },
            { elementId: 'checkout-modal-container', filePath: './pages/checkout-modal.html' },
            { elementId: 'success-modal-container', filePath: './pages/success-modal.html' }
        ]);
        
        console.log('✅ All components loaded!');
        
        // 2. Initialize application
        const app = new App();
        await app.init();
        
        console.log('🚀 Bootstrap complete!');
        
    } catch (error) {
        console.error('❌ Bootstrap failed:', error);
    }
}