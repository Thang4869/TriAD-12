import { BaseRenderer } from '../../core/base/BaseRenderer.js';
import { FormatUtils } from '../../core/utils/FormatUtils.js';
import { Logger } from '../../core/services/Logger.js';
import { formatPrice } from '../../shared/utils/helpers.js';

export class ProductsRenderer extends BaseRenderer {
    constructor() {
        super('product-grid');
        this.countElement = document.getElementById('product-count');
        this.loadMoreContainer = document.getElementById('load-more-container');
        this.searchInput = document.getElementById('search-input');
        this.sortSelect = document.getElementById('sort-select');
        this.priceSlider = document.getElementById('price-slider');
        this.priceValue = document.getElementById('price-value');
        this.resetButton = document.getElementById('reset-filter');
        this.findContainer();
    }

    render(products, totalCount = null) {
        if (!this.findContainer()) {
            Logger.debug('Product grid not found');
            return;
        }

        if (products.length === 0) {
            this.renderEmpty();
            this.updateCount(0);
            this.updateLoadMore(false);
            return;
        }

        this.container.innerHTML = '';

        products.forEach(product => {
            const card = this.createProductCard(product);
            this.container.appendChild(card);
        });

        this.updateCount(totalCount || products.length);
        this.updateLoadMore(products.length < (totalCount || products.length));
    }

    append(products) {
        if (!this.findContainer()) return;

        if (products.length === 0) return;

        products.forEach(product => {
            const card = this.createProductCard(product);
            this.container.appendChild(card);
        });

        const total = parseInt(this.countElement?.dataset.total || '0');
        const current = this.container.querySelectorAll('.product-card').length;
        this.updateLoadMore(current < total);
    }

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

    renderEmpty() {
        if (!this.container) return;

        this.container.innerHTML = `
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

    updateCount(count) {
        if (this.countElement) {
            this.countElement.textContent = `${count} products`;
            this.countElement.dataset.total = count;
        }
    }

    updateLoadMore(hasMore) {
        if (this.loadMoreContainer) {
            this.loadMoreContainer.classList.toggle('hidden', !hasMore);
        }
    }

    updatePriceDisplay(value) {
        if (this.priceValue) {
            this.priceValue.textContent = formatPrice(value);
        }
    }

    getUIState() {
        return {
            keyword: this.searchInput?.value || '',
            sort: this.sortSelect?.value || 'default',
            maxPrice: Number(this.priceSlider?.value) || 350000
        };
    }
}