export const DomUtils = {
  $(selector, context = document) {
    return context.querySelector(selector);
  },

  $$(selector, context = document) {
    return [...context.querySelectorAll(selector)];
  },

  createElement(tag, classes = "", attributes = {}, children = "") {
    const el = document.createElement(tag);
    if (classes) el.className = classes;
    Object.entries(attributes).forEach(([key, value]) =>
      el.setAttribute(key, value),
    );
    if (typeof children === "string") {
      el.innerHTML = children;
    } else if (Array.isArray(children)) {
      children.forEach((child) => el.appendChild(child));
    }
    return el;
  },

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  throttle(fn, limit = 300) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  getElementRect(el) {
    return el.getBoundingClientRect();
  },

  isVisible(el) {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  },
};
