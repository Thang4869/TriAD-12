/**
 * Product Card Component
 * 
 * Reusable product card UI component
 */
import { formatPrice } from '../../shared/utils/helpers.utils.js';

export class ProductCardComponent {
    constructor(product, options = {}) {
        this.product = product;
        this.options = {
            onAddToCart: null,
            onOpenModal: null,
            ...options
        };
    }
    
    render() {
        const div = document.createElement('div');
        div.className = 'product-card group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden';
        div.dataset.productId = this.product.id;
        
        div.innerHTML = `
            <div class="cursor-pointer" data-action="open-modal" data-id="${this.product.id}">
                <div class="bg-gray-50 p-8 relative overflow-hidden rounded-2xl shadow-inner">
                    <img src="${this.product.image}" 
                         alt="${this.product.name}" 
                         class="product-image w-full h-72 object-contain transition-transform duration-500 rounded-2xl group-hover:scale-150 ${this.product.filter || ''}"
                         style="background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.06);"
                         loading="lazy">
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-semibold">${this.product.name}</h3>
                    <p class="text-gray-500 mt-1 text-sm">${this.product.color}</p>
                    <div class="flex justify-between items-center mt-6">
                        <span class="text-2xl font-bold">${formatPrice(this.product.price)}</span>
                        <button data-action="add-to-cart" 
                                data-id="${this.product.id}"
                                class="add-to-cart-btn bg-black text-white px-5 py-3 rounded-full hover:bg-gray-800 transition-all">
                            <i class="ph ph-shopping-cart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Bind events
        div.querySelector('[data-action="add-to-cart"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.options.onAddToCart) {
                this.options.onAddToCart(this.product, e);
            }
        });
        
        div.querySelector('[data-action="open-modal"]')?.addEventListener('click', () => {
            if (this.options.onOpenModal) {
                this.options.onOpenModal(this.product.id);
            }
        });
        
        return div;
    }
}