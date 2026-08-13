import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastService } from '../../../../src/modules/toast/ToastService.js';

describe('ToastService', () => {
  let toastService;

  beforeEach(() => {
    document.body.innerHTML = `<div id="toast-container"></div>`;
    toastService = new ToastService();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show success toast', () => {
    const element = toastService.success('Success', 'Operation completed');
    expect(element).toBeTruthy();
    expect(element.classList.contains('toast-success')).toBe(true);
  });

  it('should show error toast', () => {
    const element = toastService.error('Error', 'Something went wrong');
    expect(element.classList.contains('toast-error')).toBe(true);
  });

  it('should show warning toast', () => {
    const element = toastService.warning('Warning', 'Please check your input');
    expect(element.classList.contains('toast-warning')).toBe(true);
  });

  it('should show info toast', () => {
    const element = toastService.info('Info', 'New update available');
    expect(element.classList.contains('toast-info')).toBe(true);
  });

  it('should clear all toasts', () => {
    toastService.info('Test 1', 'Message 1');
    toastService.info('Test 2', 'Message 2');
    
    const container = document.getElementById('toast-container');
    expect(container.children.length).toBe(2);
    
    toastService.clear();
    
    vi.runAllTimers();
    
    expect(container.children.length).toBe(0);
  });
});