import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DomUtils } from '../../../../src/core/utils/DomUtils.js';

describe('DomUtils', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="app">
        <div class="item" data-id="1">Item 1</div>
        <div class="item" data-id="2">Item 2</div>
        <div id="target" style="width:100px;height:50px;top:10px;left:20px;"></div>
      </div>
    `;
    container = document.getElementById('app');
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('$', () => {
    it('should select element by selector', () => {
      const el = DomUtils.$('.item');
      expect(el).toBeTruthy();
      expect(el.textContent).toBe('Item 1');
    });

    it('should use custom context', () => {
      const context = document.querySelector('#app');
      const el = DomUtils.$('.item', context);
      expect(el.textContent).toBe('Item 1');
    });

    it('should return null if not found', () => {
      const el = DomUtils.$('.non-existent');
      expect(el).toBeNull();
    });
  });

  describe('$$', () => {
    it('should select all elements by selector', () => {
      const els = DomUtils.$$('.item');
      expect(els.length).toBe(2);
      expect(els[0].textContent).toBe('Item 1');
      expect(els[1].textContent).toBe('Item 2');
    });

    it('should use custom context', () => {
      const context = document.querySelector('#app');
      const els = DomUtils.$$('.item', context);
      expect(els.length).toBe(2);
    });

    it('should return empty array if not found', () => {
      const els = DomUtils.$$('.non-existent');
      expect(els).toEqual([]);
    });
  });

  describe('createElement', () => {
    it('should create element with tag and classes', () => {
      const el = DomUtils.createElement('div', 'test-class');
      expect(el.tagName).toBe('DIV');
      expect(el.className).toBe('test-class');
    });

    it('should create element with attributes', () => {
      const el = DomUtils.createElement('a', 'link', { href: '#', 'data-test': 'value' });
      expect(el.tagName).toBe('A');
      expect(el.getAttribute('href')).toBe('#');
      expect(el.getAttribute('data-test')).toBe('value');
    });

    it('should create element with string children', () => {
      const el = DomUtils.createElement('div', '', {}, '<span>Hello</span>');
      expect(el.innerHTML).toBe('<span>Hello</span>');
    });

    it('should create element with array children', () => {
      const child1 = document.createElement('span');
      child1.textContent = 'A';
      const child2 = document.createElement('span');
      child2.textContent = 'B';
      const el = DomUtils.createElement('div', '', {}, [child1, child2]);
      expect(el.children.length).toBe(2);
      expect(el.children[0].textContent).toBe('A');
      expect(el.children[1].textContent).toBe('B');
    });

    it('should handle empty children', () => {
      const el = DomUtils.createElement('div');
      expect(el.innerHTML).toBe('');
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = DomUtils.debounce(fn, 300);

      debounced();
      debounced();
      debounced();
      vi.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = DomUtils.debounce(fn, 300);

      debounced('a', 1);
      vi.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledWith('a', 1);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const throttled = DomUtils.throttle(fn, 100);

      throttled();
      throttled();
      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(100);
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments correctly', () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const throttled = DomUtils.throttle(fn, 100);

      throttled('x');
      expect(fn).toHaveBeenCalledWith('x');
      vi.advanceTimersByTime(100);
      throttled('y');
      expect(fn).toHaveBeenCalledWith('y');
    });
  });

  describe('getElementRect', () => {
    it('should return bounding rect of element', () => {
      const el = document.getElementById('target');
      const mockRect = {
        width: 100,
        height: 50,
        top: 10,
        left: 20,
        bottom: 60,
        right: 120,
        x: 20,
        y: 10,
      };
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(mockRect);

      const rect = DomUtils.getElementRect(el);
      expect(rect).toEqual(mockRect);
    });
  });

  describe('isVisible', () => {
    it('should return true if element is in viewport', () => {
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(500);
      const el = document.getElementById('target');
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        bottom: 150,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
      });
      expect(DomUtils.isVisible(el)).toBe(true);
    });

    it('should return false if element is above viewport', () => {
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(500);
      const el = document.getElementById('target');
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: -100,
        bottom: -50,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
      });
      expect(DomUtils.isVisible(el)).toBe(false);
    });

    it('should return false if element is below viewport', () => {
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(500);
      const el = document.getElementById('target');
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: 600,
        bottom: 650,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
      });
      expect(DomUtils.isVisible(el)).toBe(false);
    });
  });
});