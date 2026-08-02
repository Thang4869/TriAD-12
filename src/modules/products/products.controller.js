/**
 * Products Controller - Orchestrates product operations
 * 
 * Single Responsibility: Coordinate between service, renderer, and events
 */
import { ProductsService } from './products.service.js';
import { ProductsRenderer } from './products.renderer.js';
import { eventBus, EVENTS } from '../../shared/services/event-bus.service.js';
import { debounce } from '../../shared/utils/dom.utils.js';

export class ProductsController {
    constructor() {
        this.service = new ProductsService();
        this.renderer = new ProductsRenderer();
        this.isLoading = false;
        
        this.setupEventListeners();
        this.service.load();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Product events
        eventBus.on(EVENTS.PRODUCTS_FILTERED, (data) => {
            const items = this.service.getCurrentPage();
            this.renderer.render(items, data.total);
        });
        
        // Setup UI event listeners
        this.setupSearch();
        this.setupSort();
        this.setupPriceFilter();
        this.setupReset();
        this.setupLoadMore();
        this.setupProductActions();
    }
    
    /**
     * Setup search with debounce
     */
    setupSearch() {
        const input = this.renderer.searchInput;
        if (!input) return;
        
        const debouncedSearch = debounce((value) => {
            this.service.updateFilters({ keyword: value.trim() });
        }, 300);
        
        input.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
            this.renderSearchSuggestions(e.target.value);
        });
    }
    
    /**
     * Setup sort
     */
    setupSort() {
        const select = this.renderer.sortSelect;
        if (!select) return;
        
        select.addEventListener('change', (e) => {
            this.service.updateFilters({ sort: e.target.value });
        });
    }
    
    /**
     * Setup price filter
     */
    setupPriceFilter() {
        const slider = this.renderer.priceSlider;
        if (!slider) return;
        
        slider.addEventListener('input', (e) => {
            const value = Number(e.target.value);
            this.renderer.updatePriceDisplay(value);
            this.service.updateFilters({ maxPrice: value });
        });
    }
    
    /**
     * Setup reset button
     */
    setupReset() {
        const button = this.renderer.resetButton;
        if (!button) return;
        
        button.addEventListener('click', () => {
            this.resetFilters();
        });
    }
    
    /**
     * Setup load more
     */
    setupLoadMore() {
        const container = this.renderer.loadMoreContainer;
        if (!container) return;
        
        // Intersection Observer for infinite scroll
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !container.classList.contains('hidden')) {
                        this.loadMore();
                    }
                });
            }, { threshold: 0.1 });
            observer.observe(container);
        }
        
        // Click fallback
        const button = container.querySelector('#load-more-btn');
        if (button) {
            button.addEventListener('click', () => this.loadMore());
        }
    }
    
    /**
     * Setup product actions (add to cart, open modal)
     */
    setupProductActions() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            
            const action = target.dataset.action;
            const id = Number(target.dataset.id);
            
            if (action === 'add-to-cart') {
                e.stopPropagation();
                const product = this.service.getProductById(id);
                if (product && window.cartController) {
                    const img = target.closest('.product-card')?.querySelector('img');
                    window.cartController.addToCart(product, 1, img);
                }
            } else if (action === 'open-modal') {
                if (window.modalController) {
                    window.modalController.open(id);
                }
            }
        });
    }
    
    /**
     * Render search suggestions
     */
    renderSearchSuggestions(keyword) {
        const container = document.getElementById('search-suggestion');
        if (!container) return;
        
        if (!keyword || keyword.length < 1) {
            container.classList.add('hidden');
            container.innerHTML = '';
            return;
        }
        
        const results = this.service.products
            .filter(p => p.matchesKeyword(keyword))
            .slice(0, 5);
        
        if (results.length === 0) {
            container.classList.add('hidden');
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = results.map(p => `
            <div class="px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center gap-3" data-id="${p.id}">
                <img src="${p.image}" alt="" class="w-10 h-10 object-contain rounded">
                <div>
                    <div class="font-medium text-sm">${p.name}</div>
                    <div class="text-xs text-gray-500">${p.color} - ${p.formattedPrice}</div>
                </div>
            </div>
        `).join('');
        
        container.querySelectorAll('[data-id]').forEach(el => {
            el.addEventListener('click', () => {
                const id = Number(el.dataset.id);
                const product = this.service.getProductById(id);
                if (product) {
                    this.service.updateFilters({ keyword: product.name });
                    const searchInput = this.renderer.searchInput;
                    if (searchInput) searchInput.value = product.name;
                    container.classList.add('hidden');
                }
            });
        });
        
        container.classList.remove('hidden');
    }
    
    /**
     * Load more products
     */
    loadMore() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const items = this.service.loadMore();
        this.renderer.append(items);
        
        setTimeout(() => {
            this.isLoading = false;
        }, 300);
    }
    
    /**
     * Reset all filters
     */
    resetFilters() {
        this.service.resetFilters();
        
        // Reset UI
        if (this.renderer.searchInput) {
            this.renderer.searchInput.value = '';
        }
        if (this.renderer.sortSelect) {
            this.renderer.sortSelect.value = 'default';
        }
        if (this.renderer.priceSlider) {
            this.renderer.priceSlider.value = 350000;
            this.renderer.updatePriceDisplay(350000);
        }
        
        // Clear suggestions
        const container = document.getElementById('search-suggestion');
        if (container) {
            container.classList.add('hidden');
            container.innerHTML = '';
        }
    }
    
    /**
     * Get product by ID
     */
    getProduct(id) {
        return this.service.getProductById(id);
    }
}