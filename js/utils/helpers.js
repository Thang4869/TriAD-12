// utils/helpers.js
export function formatPrice(price) {
    return price.toLocaleString('vi-VN') + ' ₫';
}

export function formatNumber(num) {
    return num.toLocaleString('vi-VN');
}

export function calculateTotal(cart) {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculateItemCount(cart) {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function getProductById(id) {
    return window.products?.find(p => p.id === id) || null;
}

export function generateOrderId() {
    return 'ORD-' + Date.now().toString(36).toUpperCase() + 
           '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

export function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
    return /^[0-9]{10,12}$/.test(phone.replace(/\s/g, ''));
}

export function formatDate(date) {
    return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Expose for inline usage
window.formatPrice = formatPrice;
window.formatNumber = formatNumber;
window.calculateTotal = calculateTotal;
window.calculateItemCount = calculateItemCount;
window.getProductById = getProductById;
window.generateOrderId = generateOrderId;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.formatDate = formatDate;