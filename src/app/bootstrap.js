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
    const root = getRootPath(); // './' hoặc '../'

    const sharedComponents = [
        { elementId: 'header-container', filePath: `${root}components/header.html` },
        { elementId: 'footer-container', filePath: `${root}components/footer.html` },
        { elementId: 'cart-drawer-container', filePath: `${root}pages/cart-drawer.html` },
        { elementId: 'product-modal-container', filePath: `${root}pages/product-modal.html` },
        { elementId: 'checkout-modal-container', filePath: `${root}pages/checkout-modal.html` },
        { elementId: 'success-modal-container', filePath: `${root}pages/success-modal.html` }
    ];

    const pageComponents = {
        home: [
            { elementId: 'hero-container', filePath: `${root}pages/hero-content.html` },
            { elementId: 'about-container', filePath: `${root}pages/about-preview-content.html` },
            { elementId: 'features-container', filePath: `${root}pages/features-content.html` }
        ],
        about: [
            { elementId: 'about-content', filePath: `${root}pages/about-content.html` }
        ],
        products: [
            { elementId: 'products-container', filePath: `${root}pages/products-content.html` }
        ],
        blog: [
            { elementId: 'blog-container', filePath: `${root}pages/blog-content.html` }
        ],
        'blog-detail': [
            { elementId: 'blog-detail-container', filePath: `${root}pages/blog-detail-content.html` }
        ],
        reviews: [
            { elementId: 'reviews-container', filePath: `${root}pages/reviews-content.html` }
        ],
        location: [
            { elementId: 'location-container', filePath: `${root}pages/location-content.html` }
        ],
        contact: [
            { elementId: 'contact-content', filePath: `${root}pages/contact-content.html` }
        ]
    };

    const pageSpecific = pageComponents[page] || pageComponents.home;
    return [...sharedComponents, ...pageSpecific];
}

function getRootPath() {
    const pathname = window.location.pathname;
    // Nếu URL chứa '/pages/' thì đang ở trong thư mục pages
    if (pathname.includes('/pages/')) {
        return '../';
    }
    // Các trường hợp khác (index.html, hoặc root)
    return './';
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
                setTimeout(() => {
                    if (app.fixHeaderLinks) {
                        app.fixHeaderLinks();
                    }
                    if (app.fixContentLinks) {
                        app.fixContentLinks();
                    }
                }, 500);
                
            });
        });
        
        // 5. Kích hoạt active menu
        initHeaderNavigation(currentPage);
        
        console.log('Bootstrap complete!');
        
    } catch (error) {
        console.error('Bootstrap failed:', error);
    }
}