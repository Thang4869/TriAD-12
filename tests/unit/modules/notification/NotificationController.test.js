import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationController } from '../../../../src/modules/notification/NotificationController.js';

describe('NotificationController', () => {
  let controller;

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };
    global.localStorage = localStorageMock;
    localStorageMock.getItem.mockReturnValue(null);

    document.body.innerHTML = `
      <button id="notification-btn"></button>
      <button id="mobile-notification-btn"></button>
      <div id="notification-overlay"></div>
      <div id="notification-dropdown" class="hidden"></div>
      <div id="notification-list"></div>
      <span id="notification-badge"></span>
      <span id="mobile-notification-badge"></span>
      <button id="mark-all-read"></button>
    `;
    vi.useFakeTimers();
    controller = new NotificationController();
  });

  afterEach(() => {
    vi.useRealTimers();
    controller.destroy();
  });

  it('should initialize', () => {
    expect(controller._initialized).toBe(true);
  });

  it('should add notification', () => {
    const notif = controller.add('Test', 'Message', 'info');
    expect(notif.title).toBe('Test');
    expect(controller.service.getUnreadCount()).toBeGreaterThan(0);
  });

  it('should mark as read', () => {
    const notif = controller.add('Test', 'Msg');
    expect(controller.service.getUnreadCount()).toBe(3);
    const result = controller.markAsRead(notif.id);
    expect(result).toBe(true);
    expect(controller.service.getUnreadCount()).toBe(2);
  });

  it('should mark all as read', () => {
    controller.add('A', '1');
    controller.add('B', '2');
    const changed = controller.markAllAsRead();
    expect(changed).toBe(true);
    expect(controller.service.getUnreadCount()).toBe(0);
  });

  it('should toggle dropdown', () => {
    const btn = document.getElementById('notification-btn');
    btn.click();
    expect(controller._isOpen).toBe(true);
    const dropdown = document.getElementById('notification-dropdown');
    expect(dropdown.classList.contains('hidden')).toBe(false);
    btn.click();
    expect(controller._isOpen).toBe(false);
    expect(dropdown.classList.contains('hidden')).toBe(true);
  });

  it('should close dropdown on overlay click', () => {
    controller._toggleDropdown();
    const overlay = document.getElementById('notification-overlay');
    overlay.click();
    expect(controller._isOpen).toBe(false);
  });

  it('should expose API to window', () => {
    expect(window.notifications).toBeDefined();
    expect(typeof window.notifications.add).toBe('function');
  });
});