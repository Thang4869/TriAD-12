import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from '../../../../src/modules/notification/NotificationService.js';

describe('NotificationService', () => {
  let service;

  beforeEach(() => {
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };
    global.localStorage = localStorageMock;
    service = new NotificationService();
  });

  it('should load default notifications if none in storage', () => {
    localStorage.getItem.mockReturnValue(null);
    const notifications = service.load();
    expect(notifications.length).toBe(2);
    expect(notifications[0].title).toBe('Welcome to TriAD!');
  });

  it('should load notifications from storage', () => {
    const mockData = [{ id: 1, title: 'Test', read: false }];
    localStorage.getItem.mockReturnValue(JSON.stringify(mockData));
    const notifications = service.load();
    expect(notifications.length).toBe(1);
    expect(notifications[0].title).toBe('Test');
  });

  it('should add notification', () => {
    const notif = service.add('New', 'Message', 'info');
    expect(service.getAll().length).toBe(3);
    expect(notif.title).toBe('New');
    expect(notif.read).toBe(false);
  });

  it('should mark as read', () => {
    service.add('Test', 'Msg');
    const id = service.getAll()[0].id;
    const result = service.markAsRead(id);
    expect(result).toBe(true);
    expect(service.getUnreadCount()).toBe(2);
    expect(service.getUnreadCount()).toBe(2);
  });

  it('should mark all as read', () => {
    service.add('Test1', 'Msg1');
    service.add('Test2', 'Msg2');
    const changed = service.markAllAsRead();
    expect(changed).toBe(true);
    expect(service.getUnreadCount()).toBe(0);
  });

  it('should get unread count', () => {
    expect(service.getUnreadCount()).toBe(2);
    service.add('New', 'Msg');
    expect(service.getUnreadCount()).toBe(3);
  });
});