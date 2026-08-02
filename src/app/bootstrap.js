/**
 * Bootstrap - Application entry point
 * 
 * Responsible for loading HTML components and starting the app
 */
import { loadComponents } from '../shared/utils/loader.utils.js';
import { App } from './app.js';

export async function bootstrap() {
    console.log('Bootstrapping TriAD Application...');
    
    try {
        // 1. Load HTML components
        await loadComponents([
            { elementId: 'header-container', filePath: './components/header.html' }, //components 
            { elementId: 'hero-container', filePath: './pages/hero.html' },
            { elementId: 'about-container', filePath: './pages/about.html' },
            { elementId: 'products-container', filePath: './pages/products.html' },
            { elementId: 'features-container', filePath: './pages/features.html' },
            { elementId: 'footer-container', filePath: './components/footer.html' }, //components 
            { elementId: 'cart-drawer-container', filePath: './pages/cart-drawer.html' },
            { elementId: 'product-modal-container', filePath: './pages/product-modal.html' },
            { elementId: 'checkout-modal-container', filePath: './pages/checkout-modal.html' },
            { elementId: 'success-modal-container', filePath: './pages/success-modal.html' },
            { elementId: 'blog-container', filePath: './pages/blog.html' },
            { elementId: 'reviews-container', filePath: './pages/reviews.html' },
            { elementId: 'location-container', filePath: './pages/location.html' }
        ]);
        
        console.log('All components loaded!');
        
        // 2. Initialize application
        const app = new App();
        await app.init();
        
        console.log('Bootstrap complete!');
        
    } catch (error) {
        console.error('Bootstrap failed:', error);
    }
}