import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactService } from '../../../../src/modules/contact/ContactService.js';

describe('ContactService', () => {
  let service;

  beforeEach(() => {
    vi.useFakeTimers(); // <-- thêm dòng này

    document.body.innerHTML = `
      <form id="contact-form">
        <input id="user_name">
        <input id="user_email">
        <input id="user_subject">
        <textarea id="user_message"></textarea>
        <div id="form-status"></div>
      </form>
    `;
    service = new ContactService();
    window.open = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('should setup form', () => {
    const form = document.getElementById('contact-form');
    expect(form).toBeDefined();
    const submitEvent = new Event('submit', { cancelable: true });
    const spy = vi.spyOn(service, 'handleSubmit');
    form.dispatchEvent(submitEvent);
    expect(spy).toHaveBeenCalled();
  });

  it('should handle submit with valid data', () => {
    document.getElementById('user_name').value = 'John';
    document.getElementById('user_email').value = 'john@example.com';
    document.getElementById('user_subject').value = 'Test';
    document.getElementById('user_message').value = 'Hello';
    const form = document.getElementById('contact-form');
    form.dispatchEvent(new Event('submit'));
    expect(window.open).toHaveBeenCalled();
    expect(document.getElementById('form-status').textContent).toContain('Opening Gmail');
    vi.runAllTimers();
  });

  it('should show error if name missing', () => {
    document.getElementById('user_email').value = 'john@example.com';
    const form = document.getElementById('contact-form');
    form.dispatchEvent(new Event('submit'));
    const status = document.getElementById('form-status');
    expect(status.textContent).toContain('Please enter your name');
    vi.runAllTimers();
  });

  it('should validate email', () => {
    expect(service.isValidEmail('test@example.com')).toBe(true);
    expect(service.isValidEmail('invalid')).toBe(false);
    vi.runAllTimers();
  });

  it('should show status message', () => {
    service.showStatus('Test message', 'success');
    const status = document.getElementById('form-status');
    expect(status.textContent).toBe('Test message');
    expect(status.className).toContain('text-green-600');
    vi.runAllTimers();
  });

  it('should retry setup if form not immediately available', () => {
    document.body.innerHTML = '';
    const service = new ContactService();
    vi.advanceTimersByTime(500);
    expect(service.retryCount).toBe(2);
  });

  it('should abort after max retries', () => {
    document.body.innerHTML = '';
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const service = new ContactService();

    vi.advanceTimersByTime(1000);

    expect(consoleWarn).toHaveBeenCalledWith(
      '[WARN]',
      expect.stringContaining('Aborting')
    );
    consoleWarn.mockRestore();
  });

  it('should handle email validation', () => {
    const service = new ContactService();
    expect(service.isValidEmail('test@example.com')).toBe(true);
    expect(service.isValidEmail('invalid')).toBe(false);
    expect(service.isValidEmail('')).toBe(false);
    vi.runAllTimers();
  });

  it('should show status with different types', () => {
    const service = new ContactService();
    const statusDiv = document.getElementById('form-status');
    service.showStatus('Error', 'error');
    expect(statusDiv.className).toContain('text-red-600');
    service.showStatus('Warning', 'warning');
    expect(statusDiv.className).toContain('text-yellow-600');
    service.showStatus('Info', 'info');
    expect(statusDiv.className).toContain('text-blue-600');
    vi.runAllTimers();
  });

  it('should handle submit with missing subject', () => {
    document.getElementById('user_name').value = 'John';
    document.getElementById('user_email').value = 'john@example.com';
    document.getElementById('user_subject').value = '';
    document.getElementById('user_message').value = 'Hello';
    const form = document.getElementById('contact-form');
    const showStatusSpy = vi.spyOn(service, 'showStatus');
    form.dispatchEvent(new Event('submit'));
    expect(showStatusSpy).toHaveBeenCalledWith('Please enter a subject.', 'warning');
    vi.runAllTimers();
  });

  it('should handle submit with missing message', () => {
    document.getElementById('user_name').value = 'John';
    document.getElementById('user_email').value = 'john@example.com';
    document.getElementById('user_subject').value = 'Subject';
    document.getElementById('user_message').value = '';
    const form = document.getElementById('contact-form');
    const showStatusSpy = vi.spyOn(service, 'showStatus');
    form.dispatchEvent(new Event('submit'));
    expect(showStatusSpy).toHaveBeenCalledWith('Please enter your message.', 'warning');
    vi.runAllTimers();
  });
});