import { vi } from 'vitest';

global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.fetch = vi.fn().mockImplementation((url) => {
  return Promise.resolve({
    ok: true,
    text: () => Promise.resolve(`<div>Mock HTML for ${url}</div>`),
  });
});

vi.mock('../src/modules/fly-to-cart/FlyToCartService.js', async () => {
  const actual = await vi.importActual('../src/modules/fly-to-cart/FlyToCartService.js');
  return {
    ...actual,
    FlyToCart: vi.fn().mockImplementation(() => ({
      findCartBadge: vi.fn().mockReturnValue({}),
      getImageSrc: vi.fn().mockImplementation((el) => {
        if (el.tagName === 'IMG') return el.src;
        const img = el.querySelector('img');
        return img ? img.src : '';
      }),
      createFlyElement: vi.fn().mockImplementation((src, rect) => {
        const el = document.createElement('img');
        el.src = src;
        el.style.left = rect.left + 'px';
        el.style.top = rect.top + 'px';
        return el;
      }),
      animateFly: vi.fn().mockImplementation((element, start, end, cb) => {
        element.style.left = end.x + 'px';
        element.style.top = end.y + 'px';
        cb();
      }),
      fly: vi.fn().mockImplementation((element, callback) => {
        if (callback) callback();
      }),
      isFlying: false,
    })),
  };
});