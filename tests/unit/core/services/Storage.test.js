import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from '../../../../src/core/services/Storage.js';

describe('StorageService', () => {
  let storage;
  let mockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    };
    global.localStorage = mockLocalStorage;
    storage = new StorageService('test_');
    vi.spyOn(storage, '_isAvailable').mockReturnValue(true);
  });

  it('should set and get value', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    storage.set('key', 'value');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test_key', '"value"');
    
    mockLocalStorage.getItem.mockReturnValue('"value"');
    expect(storage.get('key')).toBe('value');
  });

  it('should return default value if key not found', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    expect(storage.get('key', 'default')).toBe('default');
  });

  it('should remove value', () => {
    storage.remove('key');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_key');
  });

  it('should clear all values with prefix', () => {
    const keys = ['test_key1', 'test_key2', 'other_key'];
    vi.spyOn(Object, 'keys').mockReturnValue(keys);
    
    storage.clear();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(2);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_key1');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_key2');
  });

  it('should get all keys', () => {
    const keys = ['test_key1', 'test_key2', 'other_key'];
    vi.spyOn(Object, 'keys').mockReturnValue(keys);
    
    const result = storage.keys();
    expect(result).toContain('key1');
    expect(result).toContain('key2');
    expect(result).not.toContain('other_key');
  });
});