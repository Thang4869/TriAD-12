import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactService } from '../../../../src/modules/contact/ContactService.js';

describe('ContactService', () => {
  let service;

  beforeEach(() => {
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
  });

  it('should show error if name missing', () => {
    document.getElementById('user_email').value = 'john@example.com';
    const form = document.getElementById('contact-form');
    form.dispatchEvent(new Event('submit'));
    const status = document.getElementById('form-status');
    expect(status.textContent).toContain('Please enter your name');
  });

  it('should validate email', () => {
    expect(service.isValidEmail('test@example.com')).toBe(true);
    expect(service.isValidEmail('invalid')).toBe(false);
  });

  it('should show status message', () => {
    service.showStatus('Test message', 'success');
    const status = document.getElementById('form-status');
    expect(status.textContent).toBe('Test message');
    expect(status.className).toContain('text-green-600');
  });
});