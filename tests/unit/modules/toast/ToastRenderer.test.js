import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ToastRenderer } from '../../../../src/modules/toast/ToastRenderer.js';

describe('ToastRenderer', () => {
  let renderer;

  beforeEach(() => {
    document.body.innerHTML = '<div id="toast-container"></div>';
    renderer = new ToastRenderer();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create toast element', () => {
    const toastData = { title: 'Test', message: 'Hello', type: 'info' };
    const element = renderer.createElement(toastData);
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.querySelector('.title').textContent).toBe('Test');
    expect(element.querySelector('.message').textContent).toBe('Hello');
    expect(element.classList.contains('toast-info')).toBe(true);
  });

  it('should render toast and append to container', () => {
    const toastData = { title: 'Test', message: 'Hello', type: 'success' };
    renderer.render(toastData);
    const container = document.getElementById('toast-container');
    expect(container.children.length).toBe(1);
    const toast = container.querySelector('.toast-success');
    expect(toast).toBeTruthy();
  });

  it('should remove toast', () => {
    const toastData = { title: 'Test', message: 'Hello' };
    const element = renderer.render(toastData);
    renderer.remove(element);
    
    vi.runAllTimers();
    
    const container = document.getElementById('toast-container');
    expect(container.children.length).toBe(0);
  });
});