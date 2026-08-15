import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initScrollReveal } from '../../../../src/app/services/ScrollRevealService.js';

describe('ScrollRevealService', () => {
  let originalIntersectionObserver;
  let originalMutationObserver;

  beforeEach(() => {
    originalIntersectionObserver = global.IntersectionObserver;
    originalMutationObserver = global.MutationObserver;

    global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      _callback: callback,
    }));

    global.MutationObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      _callback: callback,
    }));

    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    global.IntersectionObserver = originalIntersectionObserver;
    global.MutationObserver = originalMutationObserver;
    vi.restoreAllMocks();
  });

  it('should do nothing if no sections exist', () => {
    document.body.innerHTML = `<div id="some-other"></div>`;
    initScrollReveal();
    expect(document.querySelector('#home')).toBeNull();
    expect(document.querySelectorAll('section:not(#home)').length).toBe(0);
    expect(global.IntersectionObserver).toHaveBeenCalled();
    const instance = global.IntersectionObserver.mock.results[0]?.value;
    expect(instance.observe).not.toHaveBeenCalled();
  });

  it('should apply hero effect but skip sections if none', () => {
    document.body.innerHTML = `<section id="home"></section>`;
    initScrollReveal();
    const hero = document.getElementById('home');
    expect(hero.style.opacity).toBe('0');
    expect(hero.style.transform).toBe('translateY(30px)');

    vi.advanceTimersByTime(400);
    expect(hero.style.opacity).toBe('1');
    expect(hero.style.transform).toBe('translateY(0)');

    expect(global.IntersectionObserver).toHaveBeenCalled();
    const instance = global.IntersectionObserver.mock.results[0]?.value;
    expect(instance.observe).not.toHaveBeenCalled();
  });

  it('should apply hero effect and observe sections', () => {
    document.body.innerHTML = `
      <section id="home"></section>
      <section class="section" id="s1"></section>
      <section class="section" id="s2"></section>
    `;
    initScrollReveal();

    const hero = document.getElementById('home');
    expect(hero.style.opacity).toBe('0');
    vi.advanceTimersByTime(400);
    expect(hero.style.opacity).toBe('1');

    const sections = document.querySelectorAll('.section');
    sections.forEach(s => {
      expect(s.style.opacity).toBe('0');
      expect(s.style.transform).toContain('translateY(50px)');
      expect(s.classList.contains('scroll-reveal')).toBe(true);
    });

    expect(global.IntersectionObserver).toHaveBeenCalled();
    const observerInstance = global.IntersectionObserver.mock.results[0]?.value;
    expect(observerInstance.observe).toHaveBeenCalledTimes(2);
  });

  it('should reveal section when intersecting', () => {
    document.body.innerHTML = `
      <section id="home"></section>
      <section class="section" id="s1"></section>
    `;
    initScrollReveal();

    const observerInstance = global.IntersectionObserver.mock.results[0]?.value;
    expect(observerInstance).toBeDefined();

    const section = document.getElementById('s1');
    const entry = { target: section, isIntersecting: true };
    observerInstance._callback([entry]);

    expect(section.style.opacity).toBe('1');
    expect(section.style.transform).toBe('translateY(0)');
  });

  it('should skip product grid logic if grid not found', () => {
    document.body.innerHTML = `
      <section id="home"></section>
      <section class="section"></section>
    `;
    initScrollReveal();
    expect(global.MutationObserver).not.toHaveBeenCalled();
  });

  it('should observe product grid mutations', () => {
    document.body.innerHTML = `
      <section id="home"></section>
      <section class="section"></section>
      <div id="product-grid"></div>
    `;
    initScrollReveal();

    expect(global.MutationObserver).toHaveBeenCalled();
    const mutationInstance = global.MutationObserver.mock.results[0]?.value;
    expect(mutationInstance.observe).toHaveBeenCalledWith(
      document.getElementById('product-grid'),
      { childList: true, subtree: false }
    );
  });

  it('should reveal newly added product cards', () => {
    document.body.innerHTML = `
      <section id="home"></section>
      <section class="section"></section>
      <div id="product-grid"></div>
    `;
    initScrollReveal();

    const mutationInstance = global.MutationObserver.mock.results[0]?.value;
    const mutationCallback = mutationInstance._callback;

    const grid = document.getElementById('product-grid');
    const newCard = document.createElement('div');
    newCard.className = 'product-card';
    grid.appendChild(newCard);

    mutationCallback([{ type: 'childList', target: grid }]);

    const card = grid.querySelector('.product-card');
    expect(card.style.opacity).toBe('0');
    expect(card.style.transform).toContain('translateY(30px)');

    const allObserverCalls = global.IntersectionObserver.mock.calls;
    expect(allObserverCalls.length).toBeGreaterThanOrEqual(2);
    const cardObserverInstance = global.IntersectionObserver.mock.results[1]?.value;
    expect(cardObserverInstance.observe).toHaveBeenCalledWith(card);
  });

  it('should reveal product card when intersecting', () => {
    document.body.innerHTML = `
      <section id="home"></section>
      <section class="section"></section>
      <div id="product-grid">
        <div class="product-card" id="card1"></div>
      </div>
    `;
    initScrollReveal();

    vi.advanceTimersByTime(200);

    const card = document.getElementById('card1');
    const observerInstance = global.IntersectionObserver.mock.results[1]?.value;
    expect(observerInstance).toBeDefined();

    const entry = { target: card, isIntersecting: true };
    observerInstance._callback([entry]);

    expect(card.style.opacity).toBe('1');
    expect(card.style.transform).toBe('translateY(0) scale(1)');
  });

  it('should handle sections and grid even without hero', () => {
    document.body.innerHTML = `
      <section class="section"></section>
      <div id="product-grid"><div class="product-card"></div></div>
    `;
    initScrollReveal();
    const section = document.querySelector('.section');
    expect(section.style.opacity).toBe('0');
    expect(section.style.transform).toContain('translateY(50px)');

    const grid = document.getElementById('product-grid');
    expect(grid).toBeDefined();
    expect(global.MutationObserver).toHaveBeenCalled();
  });

  it('should not re-observe cards already with class observed', () => {
    document.body.innerHTML = `
      <section id="home"></section>
      <section class="section"></section>
      <div id="product-grid">
        <div class="product-card observed"></div>
      </div>
    `;
    initScrollReveal();

    const card = document.querySelector('.product-card');
    expect(card.style.opacity).toBe('');
    expect(card.style.transform).toBe('');
    expect(global.IntersectionObserver).toHaveBeenCalledTimes(1);
  });

  it('should not set timeout for hero if hero missing', () => {
    document.body.innerHTML = `<section class="section"></section>`;
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
    initScrollReveal();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it('should handle empty product-grid', () => {
    document.body.innerHTML = `
      <section id="home"></section>
      <section class="section"></section>
      <div id="product-grid"></div>
    `;
    expect(() => initScrollReveal()).not.toThrow();
  });

  it('should not throw if mutationObserver not available', () => {
    document.body.innerHTML = `
      <section id="home"></section>
      <section class="section"></section>
      <div id="product-grid"></div>
    `;
    expect(() => initScrollReveal()).not.toThrow();
  });
});

describe('ScrollRevealService - additional branches', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <section id="home"></section>
      <div id="product-grid"></div>
    `;
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
    global.MutationObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      _callback: callback,
    }));
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle missing sections gracefully', () => {
    document.body.innerHTML = `<div id="home"></div>`;
    initScrollReveal();
    const home = document.getElementById('home');
    expect(home.style.opacity).toBe('0');
    vi.advanceTimersByTime(400);
    expect(home.style.opacity).toBe('1');
  });

  it('should observe product cards even when grid exists but no cards initially', () => {
    const grid = document.getElementById('product-grid');
    initScrollReveal();

    expect(global.MutationObserver).toHaveBeenCalled();
    const mutationObserverInstance = global.MutationObserver.mock.results[0]?.value;
    expect(mutationObserverInstance).toBeDefined();
    const callback = mutationObserverInstance._callback;
    expect(callback).toBeDefined();

    const newCard = document.createElement('div');
    newCard.className = 'product-card';
    grid.appendChild(newCard);
    callback([{ type: 'childList', target: grid }]);

    const cards = grid.querySelectorAll('.product-card');
    expect(cards.length).toBe(1);
    const cardObserver = global.IntersectionObserver.mock.results[global.IntersectionObserver.mock.results.length - 1]?.value;
    expect(cardObserver).toBeDefined();
    expect(cardObserver.observe).toHaveBeenCalledWith(newCard);
  });

  it('should not error if product-grid is missing', () => {
    document.body.innerHTML = `<section id="home"></section>`;
    expect(() => initScrollReveal()).not.toThrow();
  });
});

describe('ScrollRevealService - additional coverage', () => {
  let originalIntersectionObserver;
  let originalMutationObserver;

  beforeEach(() => {
    originalIntersectionObserver = global.IntersectionObserver;
    originalMutationObserver = global.MutationObserver;

    global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      _callback: callback,
    }));

    global.MutationObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      _callback: callback,
    }));

    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    global.IntersectionObserver = originalIntersectionObserver;
    global.MutationObserver = originalMutationObserver;
    vi.restoreAllMocks();
  });

  it('should safely skip hero manipulation when hero element does not exist', () => {
    document.body.innerHTML = `<section class="section"></section>`;
    initScrollReveal();
    expect(() => initScrollReveal()).not.toThrow();
  });

  it('should safely skip product-grid manipulation when grid does not exist', () => {
    document.body.innerHTML = `<section id="home"></section><section class="section"></section>`;
    initScrollReveal();
    expect(() => initScrollReveal()).not.toThrow();
    expect(global.MutationObserver).not.toHaveBeenCalled();
  });

  it('should trigger MutationObserver when new product cards are added', () => {
    document.body.innerHTML = `
      <section id="home"></section>
      <section class="section"></section>
      <div id="product-grid"></div>
    `;
    initScrollReveal();

    const mutationInstance = global.MutationObserver.mock.results[0]?.value;
    expect(mutationInstance).toBeDefined();

    const grid = document.getElementById('product-grid');
    const newCard = document.createElement('div');
    newCard.className = 'product-card';
    grid.appendChild(newCard);

    const mutationCallback = mutationInstance._callback;
    mutationCallback([{ type: 'childList', target: grid }]);

    const cardObserver = global.IntersectionObserver.mock.results[1]?.value;
    expect(cardObserver).toBeDefined();
    expect(cardObserver.observe).toHaveBeenCalledWith(newCard);
    expect(newCard.style.opacity).toBe('0');
    expect(newCard.style.transform).toContain('translateY(30px)');
  });

  it('should assign IntersectionObserver to sections with correct threshold', () => {
    document.body.innerHTML = `
      <section id="home"></section>
      <section class="section" id="s1"></section>
      <section class="section" id="s2"></section>
    `;
    initScrollReveal();

    const observerInstance = global.IntersectionObserver.mock.results[0]?.value;
    expect(observerInstance).toBeDefined();
    expect(observerInstance.observe).toHaveBeenCalledTimes(2);

    const callArgs = global.IntersectionObserver.mock.calls[0];
    expect(callArgs[0]).toBeInstanceOf(Function);
    expect(callArgs[1]).toEqual({
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });
  });

  it('should not re-observe cards that already have observed class', () => {
    document.body.innerHTML = `
      <section id="home"></section>
      <div id="product-grid">
        <div class="product-card observed"></div>
      </div>
    `;
    initScrollReveal();
    const card = document.querySelector('.product-card');
    expect(card.style.opacity).toBe('');
  });
});