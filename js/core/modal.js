// core/modal.js
import { getProductById, formatPrice } from '../utils/helpers.js';
import { addToCart } from './cart.js';
import { openCart } from './drawer.js';

let currentProductId = null;
let currentQuantity = 1;

export function openProductModal(productId) {
    const product = getProductById(productId);
    if (!product) return;
    
    currentProductId = product.id;
    currentQuantity = 1;
    
    const modalOverlay = document.getElementById('product-modal-overlay');
    const modalContent = document.getElementById('product-modal-content');
    const title = document.getElementById('modal-title');
    const price = document.getElementById('modal-price');
    const img = document.getElementById('modal-img');
    const quantityEl = document.getElementById('modal-quantity');
    
    title.textContent = product.name;
    price.textContent = formatPrice(product.price);
    img.src = product.image;
    img.className = `w-full max-w-sm h-auto object-contain transition-all duration-300 filter ${product.filter || ''}`;
    quantityEl.textContent = 1;
    
    modalOverlay.classList.remove('hidden');
    requestAnimationFrame(() => {
        modalOverlay.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
    });
    document.body.style.overflow = 'hidden';
}

export function closeModal() {
    const overlay = document.getElementById('product-modal-overlay');
    const content = document.getElementById('product-modal-content');
    
    overlay.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300);
    document.body.style.overflow = '';
}

export function updateModalQuantity(delta) {
    currentQuantity = Math.max(1, currentQuantity + delta);
    const el = document.getElementById('modal-quantity');
    if (el) el.textContent = currentQuantity;
}

export function handleAddToCart() {
    if (!currentProductId) return;
    const product = getProductById(currentProductId);
    if (!product) return;
    
    const img = document.getElementById('modal-img');
    addToCart(currentProductId, currentQuantity, img);
    closeModal();
    setTimeout(() => openCart(), 400);
}

export function handleBuyNow() {
    if (!currentProductId) return;
    const product = getProductById(currentProductId);
    if (!product) return;
    
    const img = document.getElementById('modal-img');
    addToCart(currentProductId, currentQuantity, img);
    closeModal();
    setTimeout(() => {
        openCart();
        setTimeout(() => {
            document.getElementById('checkout-btn')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
    }, 400);
}

window.openProductModal = openProductModal;
window.closeModal = closeModal;
window.updateModalQuantity = updateModalQuantity;
window.handleAddToCart = handleAddToCart;
window.handleBuyNow = handleBuyNow;