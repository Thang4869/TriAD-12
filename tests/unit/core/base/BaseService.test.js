import { describe, it, expect, vi, beforeEach } from "vitest";
import { BaseService } from "../../../../src/core/base/BaseService.js";

describe("BaseService", () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    mockRepository = {
      findAll: vi.fn(),
      save: vi.fn(),
      clear: vi.fn(),
    };
    service = new BaseService(mockRepository);
  });

  it("should load items from repository", () => {
    const items = [{ id: 1 }, { id: 2 }];
    mockRepository.findAll.mockReturnValue(items);
    const result = service.load();
    expect(result).toBe(items);
    expect(service._items).toBe(items);
    expect(service._loaded).toBe(true);
  });

  it("should not reload if already loaded", () => {
    const items = [{ id: 1 }];
    mockRepository.findAll.mockReturnValue(items);
    service.load();
    mockRepository.findAll.mockReturnValue([]);
    service.load();
    expect(service._items).toBe(items);
  });

  it("should find all items", () => {
    const items = [{ id: 1 }, { id: 2 }];
    service._items = items;
    expect(service.findAll()).toBe(items);
  });

  it("should find item by id", () => {
    const items = [{ id: 1 }, { id: 2 }];
    service._items = items;
    expect(service.findById(1)).toBe(items[0]);
    expect(service.findById(3)).toBeNull();
  });

  it("should save items and notify", () => {
    const items = [{ id: 1 }];
    const notifySpy = vi.spyOn(service, "notify");
    service.save(items);
    expect(service._items).toBe(items);
    expect(mockRepository.save).toHaveBeenCalledWith(items);
    expect(notifySpy).toHaveBeenCalled();
  });

  it("should clear items and notify", () => {
    service._items = [{ id: 1 }];
    const notifySpy = vi.spyOn(service, "notify");
    service.clear();
    expect(service._items).toEqual([]);
    expect(mockRepository.clear).toHaveBeenCalled();
    expect(notifySpy).toHaveBeenCalled();
  });

  it("should notify (no-op by default)", () => {
    expect(() => service.notify()).not.toThrow();
  });

  it("should return count", () => {
    service._items = [{ id: 1 }, { id: 2 }];
    expect(service.count).toBe(2);
  });
});
