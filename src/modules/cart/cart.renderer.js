/**
 * Cart Renderer - Handles cart UI rendering
 * 
 * Single Responsibility: Only renders cart UI
 * No business logic, only presentation
 */
import { formatPrice } from '../../shared/utils/helpers.utils.js';

export class CartRenderer {
    constructor() {
        this.container = document.querySelector('.cart-scroll');
        this.totalElement = document.getElementById('cart-total');
        this.badgeElement = document.getElementById('cart-badge');
        this.checkoutBtn = document.getElementById('checkout-btn');
    }
    
    /**
     * Render cart items
     */
    render(items) {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        
        if (!items || items.length === 0) {
            this.renderEmpty();
            this.updateTotal(0);
            this.updateBadge(0);
            return;
        }
        
        items.forEach(item => {
            const element = this.createItemElement(item);
            this.container.appendChild(element);
        });
        
        const total = items.reduce((sum, item) => sum + item.subtotal, 0);
        this.updateTotal(total);
        this.updateBadge(items.reduce((sum, item) => sum + item.quantity, 0));
    }
    
    /**
     * Create cart item HTML
     */
    createItemElement(item) {
        const div = document.createElement('div');
        div.className = 'flex gap-4 border-b border-gray-100 pb-6';
        div.dataset.id = item.id;
        
        div.innerHTML = `
            <div class="w-20 h-24 bg-gray-50 rounded flex items-center justify-center overflow-hidden">
                <img src="${item.image}" 
                    class="w-full h-full object-contain ${item.filter || ''}" 
                    alt="${item.name}">
            </div>
            <div class="flex-1">
                <div class="flex justify-between">
                    <div>
                        <h3 class="text-sm font-medium">${item.name}</h3>
                        <p class="text-gray-500">${formatPrice(item.price)}</p>
                    </div>
                    <button class="text-gray-400 hover:text-red-500 transition-colors remove-btn"
                            data-action="remove" 
                            data-id="${item.id}">
                        <i class="ph ph-trash text-lg"></i>
                    </button>
                </div>
                <div class="flex justify-between mt-4 items-center">
                    <div class="flex items-center border rounded">
                        <button class="px-3 py-1 hover:bg-gray-100 transition-colors decrease-btn"
                                data-action="decrease" 
                                data-id="${item.id}">-</button>
                        <span class="px-4 min-w-[32px] text-center">${item.quantity}</span>
                        <button class="px-3 py-1 hover:bg-gray-100 transition-colors increase-btn"
                                data-action="increase" 
                                data-id="${item.id}">+</button>
                    </div>
                    <strong>${formatPrice(item.subtotal)}</strong>
                </div>
            </div>
        `;
        
        return div;
    }
    
    /**
     * Render empty cart
     */
    renderEmpty() {
        this.container.innerHTML = `
            <div class="text-center py-20">
                <i class="ph ph-shopping-cart text-6xl text-gray-300"></i>
                <p class="mt-4 text-gray-500">The shopping cart is empty.</p>
            </div>
        `;
    }
    
    /**
     * Update badge count
     */
    updateBadge(count) {
        if (this.badgeElement) {
            this.badgeElement.textContent = count;
            this.badgeElement.style.display = count > 0 ? 'flex' : 'none';
        }
    }
    
    /**
     * Update total
     */
    updateTotal(total) {
        if (this.totalElement) {
            this.totalElement.textContent = formatPrice(total);
        }
    }
    
    /**
     * Show/hide checkout button
     */
    setCheckoutEnabled(enabled) {
        if (this.checkoutBtn) {
            this.checkoutBtn.disabled = !enabled;
            this.checkoutBtn.style.opacity = enabled ? '1' : '0.5';
        }
    }
}