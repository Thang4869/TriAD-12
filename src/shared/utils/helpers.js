export function formatPrice(price) {
    return price.toLocaleString('vi-VN') + ' ₫';
}

export function formatNumber(num) {
    return num.toLocaleString('vi-VN');
}

export function generateOrderId() {
    return 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
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

window.formatPrice = formatPrice;
window.formatNumber = formatNumber;
window.generateOrderId = generateOrderId;
window.formatDate = formatDate;