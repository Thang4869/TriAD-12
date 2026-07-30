// core/drawer.js
export function openCart() {
    const overlay = document.getElementById('cart-overlay');
    const drawer = document.getElementById('cart-drawer');
    
    if (!overlay || !drawer) return;
    
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
        overlay.classList.remove('opacity-0');
        drawer.classList.remove('translate-x-full');
    });
    document.body.style.overflow = 'hidden';
}

export function closeCart() {
    const overlay = document.getElementById('cart-overlay');
    const drawer = document.getElementById('cart-drawer');
    
    if (!overlay || !drawer) return;
    
    overlay.classList.add('opacity-0');
    drawer.classList.add('translate-x-full');
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300);
    document.body.style.overflow = '';
}

window.openCart = openCart;
window.closeCart = closeCart;