import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initScrollReveal } from '../../../../src/app/services/ScrollRevealService.js';

describe('ScrollRevealService', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <section id="home"></section>
      <section class="section"></section>
      <section class="section"></section>
      <div id="product-grid"></div>
    `;
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize scroll reveal', () => {
    initScrollReveal();
    const home = document.getElementById('home');
    expect(home.style.opacity).toBe('0');
    vi.runAllTimers();
    expect(home.style.opacity).toBe('1');
    const sections = document.querySelectorAll('.section');
    sections.forEach(s => {
      expect(s.style.opacity).toBe('0');
      expect(s.style.transform).toContain('translateY');
    });
  });
});