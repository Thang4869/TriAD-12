// core/cart.js
import { getProductById, formatPrice, calculateTotal, calculateItemCount } from '../utils/helpers.js';
import { getCartStorage, setCartStorage } from '../utils/storage.js';

let cart = getCartStorage();
window.cart = cart;

export function addToCart(productId, quantity = 1, flyElement = null) {
    try {
        const product = getProductById(productId);
        if (!product) {
            console.error('Product not found:', productId);
            if (window.toast) {
                window.toast.error('Error', 'Product not found!');
            }
            return false;
        }
        
        const existing = cart.find(item => item.id === productId);
        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.push({ ...product, quantity });
        }
        
        saveCart();
        renderCart();
        updateBadge();
        
        // Show toast
        if (window.toast) {
            window.toast.success('Added to cart', `${product.name} x${quantity}`);
        }
        
        // Fly animation
        if (flyElement && window.flyToCart) {
            console.log('Starting fly animation...');
            setTimeout(() => {
                window.flyToCart.fly(flyElement);
            }, 150);
        } else {
            console.warn('Fly animation not available:', {
                flyElement: !!flyElement,
                flyToCart: !!window.flyToCart
            });
        }
        
        return true;
    } catch (error) {
        console.error('Error adding to cart:', error);
        if (window.toast) {
            window.toast.error('Error', 'Failed to add to cart. Please try again.');
        }
        return false;
    }
}

export function removeItem(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCart();
    updateBadge();
}

export function increaseQuantity(id) {
    const item = cart.find(item => item.id === id);
    if (!item) return;
    item.quantity++;
    saveCart();
    renderCart();
    updateBadge();
}

export function decreaseQuantity(id) {
    const item = cart.find(item => item.id === id);
    if (!item) return;
    item.quantity--;
    if (item.quantity <= 0) {
        removeItem(id);
        return;
    }
    saveCart();
    renderCart();
    updateBadge();
}

export function clearCart() {
    cart = [];
    saveCart();
    renderCart();
    updateBadge();
}

export function getCartTotal() {
    return calculateTotal(cart);
}

export function getCartCount() {
    return calculateItemCount(cart);
}

export function getCartItems() {
    return [...cart];
}

function saveCart() {
    setCartStorage(cart);
    window.cart = cart;
}

export function renderCart() {
    const cartBody = document.querySelector('.cart-scroll');
    if (!cartBody) return;
    
    cartBody.innerHTML = '';
    
    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div class="text-center py-20">
                <i class="ph ph-shopping-cart text-6xl text-gray-300"></i>
                <p class="mt-4 text-gray-500">The shopping cart is empty.</p>
            </div>
        `;
        updateTotal();
        return;
    }
    
    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'flex gap-4 border-b border-gray-100 pb-6';
        div.innerHTML = `
            <div class="w-20 h-24 bg-gray-50 rounded flex items-center justify-center overflow-hidden">
                <img src="${item.image}" class="w-full h-full object-contain ${item.filter || ''}" alt="${item.name}">
            </div>
            <div class="flex-1">
                <div class="flex justify-between">
                    <div>
                        <h3 class="text-sm font-medium">${item.name}</h3>
                        <p class="text-gray-500">${formatPrice(item.price)}</p>
                    </div>
                    <button onclick="window.removeItem(${item.id})" class="text-gray-400 hover:text-red-500 transition-colors">
                        <i class="ph ph-trash text-lg"></i>
                    </button>
                </div>
                <div class="flex justify-between mt-4 items-center">
                    <div class="flex items-center border rounded">
                        <button onclick="window.decreaseQuantity(${item.id})" class="px-3 py-1 hover:bg-gray-100 transition-colors">-</button>
                        <span class="px-4 min-w-[32px] text-center">${item.quantity}</span>
                        <button onclick="window.increaseQuantity(${item.id})" class="px-3 py-1 hover:bg-gray-100 transition-colors">+</button>
                    </div>
                    <strong>${formatPrice(item.price * item.quantity)}</strong>
                </div>
            </div>
        `;
        cartBody.appendChild(div);
    });
    
    updateTotal();
}

function updateTotal() {
    const totalEl = document.getElementById('cart-total');
    if (totalEl) {
        totalEl.textContent = formatPrice(calculateTotal(cart));
    }
}

export function updateBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const count = calculateItemCount(cart);
    badge.textContent = count;
}

window.addToCart = addToCart;
window.removeItem = removeItem;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.clearCart = clearCart;
window.renderCart = renderCart;
window.updateBadge = updateBadge;
window.getCartItems = getCartItems;