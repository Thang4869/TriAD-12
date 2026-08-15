import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseRepository } from '../../../../src/core/base/BaseRepository.js';

describe('BaseRepository', () => {
  let mockStorage;
  let mockModel;
  let repository;

  class TestModel {
    constructor(data) {
      this.id = data.id;
      this.name = data.name;
    }
    toJSON() {
      return { id: this.id, name: this.name };
    }
    static fromJSON(data) {
      return new TestModel(data);
    }
  }

  beforeEach(() => {
    mockStorage = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    };
    mockModel = TestModel;
    repository = new BaseRepository(mockStorage, 'test_key', mockModel);
  });

  it('should find all items', () => {
    const mockData = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
    mockStorage.get.mockReturnValue(mockData);
    const items = repository.findAll();
    expect(items.length).toBe(2);
    expect(items[0]).toBeInstanceOf(TestModel);
    expect(items[0].id).toBe(1);
    expect(items[0].name).toBe('A');
  });

  it('should return empty array if no data', () => {
    mockStorage.get.mockReturnValue([]);
    const items = repository.findAll();
    expect(items).toEqual([]);
  });

  it('should find by id', () => {
    const mockData = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
    mockStorage.get.mockReturnValue(mockData);
    const item = repository.findById(1);
    expect(item).toBeInstanceOf(TestModel);
    expect(item.id).toBe(1);
    expect(item.name).toBe('A');
  });

  it('should return null if id not found', () => {
    const mockData = [{ id: 1, name: 'A' }];
    mockStorage.get.mockReturnValue(mockData);
    const item = repository.findById(99);
    expect(item).toBeNull();
  });

  it('should save items', () => {
    const items = [new TestModel({ id: 1, name: 'A' })];
    repository.save(items);
    expect(mockStorage.set).toHaveBeenCalledWith('test_key', [{ id: 1, name: 'A' }]);
  });

  it('should save empty items', () => {
    repository.save([]);
    expect(mockStorage.set).toHaveBeenCalledWith('test_key', []);
  });

  it('should clear storage', () => {
    repository.clear();
    expect(mockStorage.remove).toHaveBeenCalledWith('test_key');
  });

  it('should count items', () => {
    const mockData = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
    mockStorage.get.mockReturnValue(mockData);
    expect(repository.count()).toBe(2);
  });
});