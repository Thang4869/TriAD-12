// js/app.js
import { initFilters, resetFilters, setPriceFilter, loadMore } from './core/filters.js';
import { renderCart, updateBadge } from './core/cart.js';
import { openCart, closeCart } from './core/drawer.js';
import { closeModal, updateModalQuantity, handleAddToCart, handleBuyNow } from './core/modal.js';
import { openCheckout, handleCheckoutSubmit, toggleCardDetails, closeCheckout, closeSuccess } from './core/checkout.js';
import { toast } from './core/toast.js';
import { debounce } from './utils/dom.js';

// Hàm khởi tạo - export để index.js gọi
export function initApp() {
    console.log('Initializing app...');
    
    // Kiểm tra product grid có tồn tại không
    const grid = document.getElementById('product-grid');
    if (!grid) {
        console.error('Product grid not found! Retrying in 100ms...');
        setTimeout(initApp, 100);
        return;
    }
    
    const products = window.products || [];
    console.log(`Found ${products.length} products`);
    
    if (products.length === 0) {
        console.error('No products found! Check products.js');
        return;
    }
    
    // KHỞI TẠO FILTERS (sẽ render products)
    initFilters(products);
    
    // DOM Events...
    setupEventListeners();
    
    // Initial render
    renderCart();
    updateBadge();
    
    setTimeout(() => {
        toast.info('Welcome!', 'Start exploring our premium thermal lunch boxes.');
    }, 1000);
}

function setupEventListeners() {
    // Mobile Menu
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    let isMenuOpen = false;
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            isMenuOpen = !isMenuOpen;
            if (isMenuOpen) {
                mobileMenu.classList.remove('hidden');
                mobileMenuBtn.innerHTML = '<i class="ph ph-x text-2xl"></i>';
            } else {
                mobileMenu.classList.add('hidden');
                mobileMenuBtn.innerHTML = '<i class="ph ph-list text-2xl"></i>';
            }
        });
        
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                isMenuOpen = false;
                mobileMenu.classList.add('hidden');
                mobileMenuBtn.innerHTML = '<i class="ph ph-list text-2xl"></i>';
            });
        });
    }
    
    // Cart Drawer
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartIconBtn = document.getElementById('cart-icon-btn');
    const mobileCartBtn = document.getElementById('mobile-cart-btn');
    
    if (cartIconBtn) cartIconBtn.addEventListener('click', openCart);
    if (mobileCartBtn) mobileCartBtn.addEventListener('click', openCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
    
    // Modal
    const modalOverlay = document.getElementById('product-modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }
    
    const qtyPlus = document.getElementById('qty-plus');
    const qtyMinus = document.getElementById('qty-minus');
    if (qtyPlus) qtyPlus.addEventListener('click', () => updateModalQuantity(1));
    if (qtyMinus) qtyMinus.addEventListener('click', () => updateModalQuantity(-1));
    
    const addCartBtn = document.getElementById('add-cart-btn');
    const buyNowBtn = document.getElementById('modal-buy-now-btn');
    if (addCartBtn) addCartBtn.addEventListener('click', handleAddToCart);
    if (buyNowBtn) buyNowBtn.addEventListener('click', handleBuyNow);
    
    // Checkout
    const checkoutBtn = document.getElementById('checkout-btn');
    const closeCheckoutBtn = document.getElementById('close-checkout-btn');
    const checkoutForm = document.getElementById('checkout-form');
    const successCloseBtn = document.getElementById('success-close-btn');
    
    if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckout);
    if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', closeCheckout);
    if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    if (successCloseBtn) successCloseBtn.addEventListener('click', closeSuccess);
    
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', toggleCardDetails);
    });
    
    // Search
    const searchInput = document.getElementById('search-input');
    const searchSuggestion = document.getElementById('search-suggestion');
    
    if (searchInput) {
        const debouncedSearch = debounce((value) => {
            if (window.searchProducts) window.searchProducts(value);
            renderSuggestions(value);
        }, 300);
        
        searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
        searchInput.addEventListener('blur', () => {
            setTimeout(() => searchSuggestion?.classList.add('hidden'), 200);
        });
        searchInput.addEventListener('focus', () => {
            if (searchInput.value) renderSuggestions(searchInput.value);
        });
    }
    
    function renderSuggestions(keyword) {
        if (!searchSuggestion) return;
        if (!keyword || keyword.length < 1) {
            searchSuggestion.classList.add('hidden');
            searchSuggestion.innerHTML = '';
            return;
        }
        
        const products = window.products || [];
        const results = products.filter(p => 
            p.name.toLowerCase().includes(keyword.toLowerCase())
        ).slice(0, 5);
        
        if (results.length === 0) {
            searchSuggestion.classList.add('hidden');
            searchSuggestion.innerHTML = '';
            return;
        }
        
        searchSuggestion.innerHTML = results.map(p => `
            <div class="px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center gap-3" data-id="${p.id}">
                <img src="${p.image}" alt="" class="w-10 h-10 object-contain rounded">
                <div>
                    <div class="font-medium text-sm">${p.name}</div>
                    <div class="text-xs text-gray-500">${p.color}</div>
                </div>
            </div>
        `).join('');
        
        searchSuggestion.querySelectorAll('[data-id]').forEach(el => {
            el.addEventListener('click', () => {
                const id = Number(el.dataset.id);
                const product = products.find(p => p.id === id);
                if (product && window.openProductModal) window.openProductModal(id);
                searchSuggestion.classList.add('hidden');
                searchInput.value = product?.name || '';
            });
        });
        
        searchSuggestion.classList.remove('hidden');
    }
    
    // Filters
    const sortSelect = document.getElementById('sort-select');
    const priceSlider = document.getElementById('price-slider');
    const resetFilterBtn = document.getElementById('reset-filter');
    
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            if (window.filterState) window.filterState.sort = e.target.value;
            if (window.applyFilters) window.applyFilters();
        });
    }
    
    if (priceSlider) {
        priceSlider.addEventListener('input', (e) => {
            const value = Number(e.target.value);
            const priceDisplay = document.getElementById('price-value');
            if (priceDisplay) priceDisplay.textContent = window.formatPrice(value);
            if (window.setPriceFilter) window.setPriceFilter(value);
        });
    }
    
    if (resetFilterBtn) resetFilterBtn.addEventListener('click', resetFilters);
    
    // Load More with Intersection Observer
    const loadMoreContainer = document.getElementById('load-more-container');
    if (loadMoreContainer && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !loadMoreContainer.classList.contains('hidden')) {
                    if (window.loadMore) window.loadMore();
                }
            });
        }, { threshold: 0.1 });
        observer.observe(loadMoreContainer);
    }
    
    // Accordion
    const firstAccordion = document.querySelector('.accordion-item');
    if (firstAccordion) firstAccordion.classList.add('accordion-active');
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modalOpen = !document.getElementById('product-modal-overlay')?.classList.contains('hidden');
            const checkoutOpen = !document.getElementById('checkout-modal')?.classList.contains('hidden');
            const successOpen = !document.getElementById('success-modal')?.classList.contains('hidden');
            const cartOpen = !document.getElementById('cart-drawer')?.classList.contains('translate-x-full');
            
            if (modalOpen) closeModal();
            else if (checkoutOpen) closeCheckout();
            else if (successOpen) closeSuccess();
            else if (cartOpen) closeCart();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('search-input')?.focus();
        }
    });
}

// Error handling
window.addEventListener('error', (e) => {
    console.error('Uncaught error:', e.error || e.message);
    if (window.toast) {
        window.toast.error('Something went wrong', 'Please try again or refresh the page.');
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled rejection:', e.reason);
    if (window.toast) {
        window.toast.error('Error', 'An unexpected error occurred.');
    }
});