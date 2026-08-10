/**
 * Products Renderer - Handles product UI rendering
 * 
 * Single Responsibility: Only renders product UI
 */
import { logger } from '../../shared/services/logger.service.js';
import { formatPrice } from '../../shared/utils/helpers.utils.js';

export class ProductsRenderer {
    constructor() {
        this.grid = null;
        this.countElement = null;
        this.loadMoreContainer = null;
        this.searchInput = null;
        this.sortSelect = null;
        this.priceSlider = null;
        this.priceValue = null;
        this.resetButton = null;
        this._retryCount = 0;
        this._maxRetries = 2;
        
        // Tìm DOM elements với retry
        this.initElements();
    }
    
    /**
     * Initialize DOM elements với retry
     */
    initElements() {
        this.grid = document.getElementById('product-grid');
        this.countElement = document.getElementById('product-count');
        this.loadMoreContainer = document.getElementById('load-more-container');
        this.searchInput = document.getElementById('search-input');
        this.sortSelect = document.getElementById('sort-select');
        this.priceSlider = document.getElementById('price-slider');
        this.priceValue = document.getElementById('price-value');
        this.resetButton = document.getElementById('reset-filter');
        
        // Nếu chưa tìm thấy grid, thử lại sau 100ms
        if (!this.grid && this._retryCount < this._maxRetries) {
            this._retryCount++;
            setTimeout(() => this.initElements(), 100);
        }
        
        if (this.grid) {
            logger.debug('Product grid found!');
        } else {
            logger.debug('Product grid not found after retries');
        }
    }
    
    /**
     * Render products
     */
    render(products, totalCount = null) {
        // Đảm bảo grid đã được tìm thấy
        if (!this.grid) {
            this.initElements();
            if (!this.grid) {
                logger.debug('Product grid not found!');
                return;
            }
        }
        
        if (products.length === 0) {
            this.renderEmpty();
            this.updateCount(0);
            this.updateLoadMore(false);
            return;
        }
        
        // Clear grid first
        this.grid.innerHTML = '';
        
        // Render each product
        products.forEach(product => {
            const card = this.createProductCard(product);
            this.grid.appendChild(card);
        });
        
        // Update count and load more
        this.updateCount(totalCount || products.length);
        this.updateLoadMore(products.length < (totalCount || products.length));
    }
    
    /**
     * Append more products (for load more)
     */
    append(products) {
        if (!this.grid) {
            this.initElements();
            if (!this.grid) return;
        }
        
        if (products.length === 0) return;
        
        products.forEach(product => {
            const card = this.createProductCard(product);
            this.grid.appendChild(card);
        });
        
        // Update load more status
        const total = parseInt(this.countElement?.dataset.total || '0');
        const current = this.grid.querySelectorAll('.product-card').length;
        this.updateLoadMore(current < total);
    }
    
    /**
     * Create product card HTML
     */
    createProductCard(product) {
        const div = document.createElement('div');
        div.className = 'product-card group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden';
        div.dataset.productId = product.id;
        
        div.innerHTML = `
            <div class="cursor-pointer" data-action="open-modal" data-id="${product.id}">
                <div class="bg-gray-50 p-8 relative overflow-hidden rounded-2xl shadow-inner">
                    <img src="${product.image}" 
                         alt="${product.name}" 
                         class="product-image w-full h-72 object-contain transition-transform duration-500 rounded-2xl group-hover:scale-150 ${product.filter || ''}"
                         style="background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.06);"
                         loading="lazy">
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-semibold">${product.name}</h3>
                    <p class="text-gray-500 mt-1 text-sm">${product.color}</p>
                    <div class="flex justify-between items-center mt-6">
                        <span class="text-2xl font-bold">${formatPrice(product.price)}</span>
                        <button data-action="add-to-cart" 
                                data-id="${product.id}"
                                class="add-to-cart-btn bg-black text-white px-5 py-3 rounded-full hover:bg-gray-800 transition-all">
                            <i class="ph ph-shopping-cart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return div;
    }
    
    /**
     * Render empty state
     */
    renderEmpty() {
        if (!this.grid) return;
        
        this.grid.innerHTML = `
            <div class="col-span-full text-center py-20">
                <i class="ph ph-magnifying-glass text-6xl text-gray-300"></i>
                <p class="mt-4 text-gray-500">No products found</p>
                <button id="clear-search-btn" class="mt-4 text-brand-accent hover:underline">
                    Clear filters
                </button>
            </div>
        `;
        
        document.getElementById('clear-search-btn')?.addEventListener('click', () => {
            if (window.productsController) {
                window.productsController.resetFilters();
            }
        });
    }
    
    /**
     * Update product count
     */
    updateCount(count) {
        if (this.countElement) {
            this.countElement.textContent = `${count} products`;
            this.countElement.dataset.total = count;
        }
    }
    
    /**
     * Update load more visibility
     */
    updateLoadMore(hasMore) {
        if (this.loadMoreContainer) {
            this.loadMoreContainer.classList.toggle('hidden', !hasMore);
        }
    }
    
    /**
     * Update price display
     */
    updatePriceDisplay(value) {
        if (this.priceValue) {
            this.priceValue.textContent = formatPrice(value);
        }
    }
    
    /**
     * Get filter values from UI
     */
    getUIState() {
        return {
            keyword: this.searchInput?.value || '',
            sort: this.sortSelect?.value || 'default',
            maxPrice: Number(this.priceSlider?.value) || 350000
        };
    }
}