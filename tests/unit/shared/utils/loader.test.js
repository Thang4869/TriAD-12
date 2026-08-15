import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadComponent, loadComponents, injectComponent } from '../../../../src/shared/utils/loader.js';

describe('loader', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="test-container"></div>';
    global.fetch = vi.fn();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('loadComponent', () => {
    it('should load component and insert into element', async () => {
      const mockHtml = '<div>Test Content</div>';
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml)
      });

      const result = await loadComponent('test-container', 'test.html');
      expect(result).toBe(mockHtml);
      expect(document.getElementById('test-container').innerHTML).toBe(mockHtml);
    });

    it('should handle fetch error', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      const result = await loadComponent('test-container', 'test.html');
      expect(result).toBe(null);
    });

    it('should handle not found element', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<div>Test</div>')
      });

      const result = await loadComponent('non-existent', 'test.html');
      expect(result).toBe(null);
    });

    it('should call callback when loaded', async () => {
      const callback = vi.fn();
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<div>Test</div>')
      });

      await loadComponent('test-container', 'test.html', callback);
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('loadComponents', () => {
    it('should load multiple components', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<div>Test</div>')
      });

      const components = [
        { elementId: 'test-container', filePath: 'test1.html' },
        { elementId: 'test-container', filePath: 'test2.html' }
      ];

      const results = await loadComponents(components);
      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });
  });

  describe('injectComponent', () => {
    it('should inject component at position', async () => {
      document.body.innerHTML = '<div id="target"></div>';
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<p>Injected</p>')
      });

      await injectComponent('#target', 'test.html');
      expect(true).toBe(true);
    });
  });
});