// core/checkout.js
import { getCartItems, clearCart, getCartTotal } from './cart.js';
import { formatPrice, generateOrderId, validateEmail, validatePhone } from '../utils/helpers.js';
import { toast } from './toast.js';
import { closeCart } from './drawer.js';

let checkoutItems = [];

export function openCheckout() {
    const items = getCartItems();
    if (items.length === 0) {
        toast.warning('Empty Cart', 'Please add items to your cart before checking out.');
        return;
    }
    
    checkoutItems = items;
    
    const modal = document.getElementById('checkout-modal');
    const content = modal.querySelector('.bg-white');
    
    const itemsContainer = document.getElementById('checkout-items');
    itemsContainer.innerHTML = items.map(item => `
        <div class="item-row flex justify-between text-sm py-1">
            <span>${item.name} x${item.quantity}</span>
            <span>${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join('');
    
    const total = getCartTotal();
    const shipping = total >= 500000 ? 0 : 30000;
    document.getElementById('checkout-total').textContent = formatPrice(total + shipping);
    
    document.getElementById('checkout-form').reset();
    document.getElementById('card-details').classList.add('hidden');
    
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    });
    document.body.style.overflow = 'hidden';
}

export function closeCheckout() {
    const modal = document.getElementById('checkout-modal');
    const content = modal.querySelector('.bg-white');
    
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
    document.body.style.overflow = '';
}

export function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'cod';
    
    if (!firstName || !lastName || !email || !phone || !address) {
        toast.error('Missing Information', 'Please fill in all required fields.');
        return;
    }
    
    if (!validateEmail(email)) {
        toast.error('Invalid Email', 'Please enter a valid email address.');
        return;
    }
    
    if (!validatePhone(phone)) {
        toast.error('Invalid Phone', 'Please enter a valid phone number (10-12 digits).');
        return;
    }
    
    if (paymentMethod === 'card') {
        const cardNumber = document.getElementById('card-number').value.trim();
        const cardExpiry = document.getElementById('card-expiry').value.trim();
        const cardCvv = document.getElementById('card-cvv').value.trim();
        
        if (!cardNumber || !cardExpiry || !cardCvv) {
            toast.error('Missing Card Details', 'Please fill in all card details.');
            return;
        }
        
        if (cardNumber.replace(/\s/g, '').length < 16) {
            toast.error('Invalid Card', 'Please enter a valid 16-digit card number.');
            return;
        }
    }
    
    toast.info('Processing', 'Please wait while we process your order...');
    
    setTimeout(() => {
        const orderId = generateOrderId();
        const orderData = {
            id: orderId,
            date: new Date().toISOString(),
            firstName,
            lastName,
            email,
            phone,
            address,
            paymentMethod,
            items: checkoutItems,
            total: getCartTotal()
        };
        
        const orders = JSON.parse(localStorage.getItem('aura_orders') || '[]');
        orders.push(orderData);
        localStorage.setItem('aura_orders', JSON.stringify(orders));
        
        clearCart();
        closeCheckout();
        closeCart();
        showSuccess(orderId);
        toast.success('Order Placed!', `Order #${orderId} confirmed.`);
    }, 1500);
}

function showSuccess(orderId) {
    const modal = document.getElementById('success-modal');
    const content = modal.querySelector('.bg-white');
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    });
}

export function closeSuccess() {
    const modal = document.getElementById('success-modal');
    const content = modal.querySelector('.bg-white');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
    document.body.style.overflow = '';
    if (window.applyFilters) window.applyFilters();
}

export function toggleCardDetails() {
    const selected = document.querySelector('input[name="payment"]:checked');
    const cardDetails = document.getElementById('card-details');
    if (selected && selected.value === 'card') {
        cardDetails.classList.remove('hidden');
    } else {
        cardDetails.classList.add('hidden');
    }
}

window.openCheckout = openCheckout;
window.closeCheckout = closeCheckout;
window.closeSuccess = closeSuccess;
window.handleCheckoutSubmit = handleCheckoutSubmit;
window.toggleCardDetails = toggleCardDetails;