import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationRenderer } from '../../../../src/modules/notification/NotificationRenderer.js';

describe('NotificationRenderer', () => {
  let renderer;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="notification-list"></div>
      <span id="notification-badge"></span>
      <span id="mobile-notification-badge"></span>
      <div id="notification-dropdown" class="hidden"></div>
      <div id="notification-overlay" class="hidden"></div>
    `;
    renderer = new NotificationRenderer();
  });

  it('should render list', () => {
    const notifications = [
      { id: 1, title: 'Test', message: 'Hello', type: 'info', read: false, createdAt: new Date().toISOString() },
    ];
    renderer.renderList(notifications);
    const container = document.getElementById('notification-list');
    expect(container.innerHTML).toContain('Test');
    expect(container.innerHTML).toContain('Hello');
  });

  it('should render empty state', () => {
    renderer.renderList([]);
    const container = document.getElementById('notification-list');
    expect(container.innerHTML).toContain('All caught up!');
  });

  it('should update badge', () => {
    renderer.updateBadge(5);
    const badge = document.getElementById('notification-badge');
    expect(badge.textContent).toBe('5');
    expect(badge.classList.contains('hidden')).toBe(false);

    renderer.updateBadge(0);
    expect(badge.classList.contains('hidden')).toBe(true);
  });

  it('should show/hide dropdown', () => {
    renderer.showDropdown();
    const dropdown = document.getElementById('notification-dropdown');
    expect(dropdown.classList.contains('hidden')).toBe(false);
    const overlay = document.getElementById('notification-overlay');
    expect(overlay.classList.contains('hidden')).toBe(false);

    renderer.hideDropdown();
    expect(dropdown.classList.contains('hidden')).toBe(true);
    expect(overlay.classList.contains('hidden')).toBe(true);
  });

  it('should format time', () => {
    const now = new Date();
    const result = renderer.formatTime(now.toISOString());
    expect(result).toBe('Just now');

    const past = new Date(now - 5 * 60 * 1000);
    expect(renderer.formatTime(past.toISOString())).toBe('5m ago');
  });
});