import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationController } from '../../../../src/modules/notification/NotificationController.js';
import { eventBus } from '../../../../src/core/services/EventBus.js';
import { EVENTS } from '../../../../src/shared/constants/Events.js';

describe('NotificationController', () => {
  let controller;

  beforeEach(() => {
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

describe('NotificationController additional', () => {
  let controller;
  let mockToast;

  beforeEach(() => {
    const localStorageMock = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
    };
    global.localStorage = localStorageMock;

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

    mockToast = {
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    };
    window.toast = mockToast;
    window.eventBus = { on: vi.fn() };

    vi.useFakeTimers();
    controller = new NotificationController();
  });

  afterEach(() => {
    vi.useRealTimers();
    controller.destroy();
    delete window.toast;
    delete window.eventBus;
  });

  it('should reinit when listeners not attached', () => {
    controller._listenersAttached = false;
    const setupSpy = vi.spyOn(controller, '_setupEventListeners');
    controller.reinit();
    expect(setupSpy).toHaveBeenCalled();
  });

  it('should not reinit when listeners already attached', () => {
    controller._listenersAttached = true;
    const updateSpy = vi.spyOn(controller, '_updateUI');
    controller.reinit();
    expect(updateSpy).toHaveBeenCalled();
  });

  it('should close dropdown when clicking outside', () => {
    controller._isOpen = true;
    const closeSpy = vi.spyOn(controller, '_closeDropdown');
    document.body.click();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should mark notification as read when clicked', () => {
    const notif = controller.add('Test', 'Msg', 'info');
    const item = document.createElement('div');
    item.className = 'notification-item';
    item.dataset.id = notif.id;
    document.body.appendChild(item);
    const markSpy = vi.spyOn(controller, 'markAsRead');
    item.click();
    expect(markSpy).toHaveBeenCalledWith(notif.id);
  });

  it('should add notification via eventBus on CHECKOUT_COMPLETED', () => {
    window.eventBus = eventBus;
    const addSpy = vi.spyOn(controller, 'add');
    const order = { id: 'ORD-123' };
    eventBus.emit(EVENTS.CHECKOUT_COMPLETED, { order });
    expect(addSpy).toHaveBeenCalledWith('New Order', 'Order #ORD-123 placed!', 'order');
  });

  it('should add system error on window error', () => {
    const addSpy = vi.spyOn(controller, 'add');
    const errorEvent = new ErrorEvent('error', { error: new Error('Test error') });
    window.dispatchEvent(errorEvent);
    expect(addSpy).toHaveBeenCalledWith('System Error', 'An unexpected error occurred.', 'warning');
  });

  it('should animate bell on add notification', () => {
    const btn = document.getElementById('notification-btn');
    btn.style.animation = '';
    controller.add('Test', 'Msg');
    expect(btn.style.animation).toContain('bellRing');
  });

  it('markAsRead should return false if id not found', () => {
    const result = controller.markAsRead(99999);
    expect(result).toBe(false);
  });

  it('destroy should clear timers and reset state', () => {
    controller.destroy();
    expect(controller._listenersAttached).toBe(false);
    expect(controller._documentEventsAttached).toBe(false);
    expect(controller._initialized).toBe(false);
  });

  it('reinit should call _setupEventListeners if not attached', () => {
    controller._listenersAttached = false;
    const setupSpy = vi.spyOn(controller, '_setupEventListeners');
    controller.reinit();
    expect(setupSpy).toHaveBeenCalled();
  });
});