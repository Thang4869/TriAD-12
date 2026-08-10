/**
 * Bootstrap - Application entry point
 * 
 * Responsible for loading HTML components and starting the app
 */
import { loadComponents } from '../shared/utils/loader.utils.js';
import { App } from './app.js';
import { initHeaderNavigation } from './header-navigation.service.js';

/**
 * Xác định trang hiện tại dựa vào URL
 */
function getCurrentPage() {
    const pathname = window.location.pathname;
    const filename = pathname.split('/').pop();

    if (!filename || filename === 'index.html') {
        return 'home';
    }

    const page = filename.replace('.html', '');

    const pageMap = {
        about: 'about',
        products: 'products',
        blog: 'blog',
        'blog-detail': 'blog-detail',
        reviews: 'reviews',
        location: 'location',
        contact: 'contact'
    };

    return pageMap[page] || 'home';
}

/**
 * Lấy danh sách components cần load cho từng trang
 */
function getComponentsForPage(page) {
    // Components chung cho tất cả trang
    const sharedComponents = [
        { elementId: 'header-container', filePath: './components/header.html' },
        { elementId: 'footer-container', filePath: './components/footer.html' },
        { elementId: 'cart-drawer-container', filePath: './pages/cart-drawer.html' },
        { elementId: 'product-modal-container', filePath: './pages/product-modal.html' },
        { elementId: 'checkout-modal-container', filePath: './pages/checkout-modal.html' },
        { elementId: 'success-modal-container', filePath: './pages/success-modal.html' }
    ];

// Components đặc thù cho từng trang
    const pageComponents = {
        // Trang chủ
        home: [
            { elementId: 'hero-container', filePath: './pages/hero-content.html' },
            { elementId: 'about-container', filePath: './pages/about-preview-content.html' },
            { elementId: 'features-container', filePath: './pages/features-content.html' }
        ],
        
        // Trang Giới thiệu
        about: [
            { elementId: 'about-content', filePath: './pages/about-content.html' }
        ],
        
        // Trang Sản phẩm
        products: [
            { elementId: 'products-container', filePath: './pages/products-content.html' }
        ],
        
        // Trang Blog
        blog: [
            { elementId: 'blog-container', filePath: './pages/blog-content.html' }
        ],
        
        // Trang Chi tiết Blog
        'blog-detail': [
            { elementId: 'blog-detail-container', filePath: './pages/blog-detail-content.html' }
        ],
        
        // Trang Đánh giá
        reviews: [
            { elementId: 'reviews-container', filePath: './pages/reviews-content.html' }
        ],
        
        // Trang Vị trí
        location: [
            { elementId: 'location-container', filePath: './pages/location-content.html' }
        ],
        
        // Trang Liên hệ
        contact: [
            { elementId: 'contact-content', filePath: './pages/contact-content.html' }
        ]
    };

    // Kết hợp components chung + components đặc thù
    const pageSpecific = pageComponents[page] || pageComponents.home;
    return [...sharedComponents, ...pageSpecific];
}

export async function bootstrap() {
    console.log('Bootstrapping TriAD Application...');
    
    try {
        // 1. Xác định trang hiện tại
        const currentPage = getCurrentPage();
        console.log(`Current page: ${currentPage}`);
        
        // 2. Lấy danh sách components cần load
        const components = getComponentsForPage(currentPage);
        console.log(`Loading ${components.length} components...`);
        
        // 3. Load tất cả components
        const results = await loadComponents(components);
        
        // Kiểm tra kết quả load
        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
            console.warn('Some components failed to load:', failed);
        } else {
            console.log('All components loaded successfully!');
        }
        
        // 4. Khởi tạo application (đợi DOM update)
        // Sử dụng requestAnimationFrame để đảm bảo DOM đã được cập nhật
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const app = new App();
                app.init();
            });
        });
        
        // 5. Kích hoạt active menu
        initHeaderNavigation(currentPage);
        
        console.log('Bootstrap complete!');
        
    } catch (error) {
        console.error('Bootstrap failed:', error);
    }
}