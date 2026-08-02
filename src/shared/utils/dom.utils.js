/**
 * DOM Utilities - Common DOM operations
 */
export function $(selector, context = document) {
    return context.querySelector(selector);
}

export function $$(selector, context = document) {
    return [...context.querySelectorAll(selector)];
}

export function createElement(tag, classes = '', attributes = {}, children = '') {
    const el = document.createElement(tag);
    if (classes) el.className = classes;
    Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value));
    if (typeof children === 'string') {
        el.innerHTML = children;
    } else if (Array.isArray(children)) {
        children.forEach(child => el.appendChild(child));
    }
    return el;
}

export function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

export function throttle(fn, limit = 300) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

export function getElementRect(el) {
    return el.getBoundingClientRect();
}

export function isVisible(el) {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
}

// Expose for inline usage
window.$ = $;
window.$$ = $$;
window.createElement = createElement;
window.debounce = debounce;
window.throttle = throttle;