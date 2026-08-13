import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../../../../src/core/services/EventBus.js';

describe('EventBus', () => {
  let eventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  it('should subscribe and emit events', () => {
    const callback = vi.fn();
    eventBus.on('test', callback);
    eventBus.emit('test', { data: 'test' });
    expect(callback).toHaveBeenCalledWith({ data: 'test' });
  });

  it('should unsubscribe events', () => {
    const callback = vi.fn();
    const unsubscribe = eventBus.on('test', callback);
    unsubscribe();
    eventBus.emit('test');
    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle once events', () => {
    const callback = vi.fn();
    eventBus.once('test', callback);
    eventBus.emit('test');
    eventBus.emit('test');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should clear all events', () => {
    const callback = vi.fn();
    eventBus.on('test1', callback);
    eventBus.on('test2', callback);
    eventBus.clear();
    eventBus.emit('test1');
    eventBus.emit('test2');
    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle multiple subscribers', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    eventBus.on('test', callback1);
    eventBus.on('test', callback2);
    eventBus.emit('test');
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});