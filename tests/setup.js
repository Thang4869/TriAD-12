import { vi } from "vitest";

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
