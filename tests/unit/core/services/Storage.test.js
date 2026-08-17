import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StorageService } from "../../../../src/core/services/Storage.js";

describe("StorageService", () => {
  let storage;
  let mockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };
    global.localStorage = mockLocalStorage;
    storage = new StorageService("test_");
    vi.spyOn(storage, "_isAvailable").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("when localStorage is available", () => {
    it("should set and get value", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      storage.set("key", "value");
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("test_key", '"value"');

      mockLocalStorage.getItem.mockReturnValue('"value"');
      expect(storage.get("key")).toBe("value");
    });

    it("should return default value if key not found", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(storage.get("key", "default")).toBe("default");
    });

    it("should remove value", () => {
      storage.remove("key");
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("test_key");
    });

    it("should clear all values with prefix", () => {
      const keys = ["test_key1", "test_key2", "other_key"];
      vi.spyOn(Object, "keys").mockReturnValue(keys);

      storage.clear();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(2);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("test_key1");
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("test_key2");
    });

    it("should get all keys", () => {
      const keys = ["test_key1", "test_key2", "other_key"];
      vi.spyOn(Object, "keys").mockReturnValue(keys);

      const result = storage.keys();
      expect(result).toContain("key1");
      expect(result).toContain("key2");
      expect(result).not.toContain("other_key");
    });
  });

  describe("when localStorage throws error on set", () => {
    it("should fallback to memory and return false", () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("Quota exceeded");
      });
      const result = storage.set("key", "value");
      expect(result).toBe(false);
      expect(storage._memory.get("test_key")).toBe("value");
    });
  });

  describe("when localStorage is not available (fallback to memory)", () => {
    beforeEach(() => {
      vi.spyOn(storage, "_isAvailable").mockReturnValue(false);
    });

    it("should store in memory on set", () => {
      storage.set("key", "value");
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      expect(storage._memory.get("test_key")).toBe("value");
    });

    it("should get from memory", () => {
      storage._memory.set("test_key", "memoryValue");
      const value = storage.get("key", "default");
      expect(value).toBe("memoryValue");
    });

    it("should return default if key not in memory", () => {
      const value = storage.get("nonexistent", "default");
      expect(value).toBe("default");
    });

    it("should remove from memory", () => {
      storage._memory.set("test_key", "value");
      storage.remove("key");
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
      expect(storage._memory.has("test_key")).toBe(false);
    });

    it("should clear memory", () => {
      storage._memory.set("test_key1", "a");
      storage._memory.set("test_key2", "b");
      storage.clear();
      expect(mockLocalStorage.clear).not.toHaveBeenCalled();
      expect(storage._memory.size).toBe(0);
    });

    it("should get keys from memory", () => {
      storage._memory.set("test_a", "a");
      storage._memory.set("test_b", "b");
      const keys = storage.keys();
      expect(keys).toContain("a");
      expect(keys).toContain("b");
    });
  });

  describe("_isAvailable method (real localStorage)", () => {
    it("should return true if localStorage works (covers lines 13-14)", () => {
      const realStorage = new StorageService("test_");
      expect(realStorage._isAvailable()).toBe(true);
    });

    it("should return false if localStorage throws error", () => {
      const setItemMock = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
        throw new Error("Storage error");
      });
      const realStorage = new StorageService("test_");
      expect(realStorage._isAvailable()).toBe(false);
      setItemMock.mockRestore();
    });
  });

  describe("keys merge logic", () => {
    it("should merge keys from localStorage and memory", () => {
      vi.spyOn(Object, "keys").mockReturnValue(["test_a", "test_b", "other"]);
      storage._memory.set("test_c", "c");
      const keys = storage.keys();
      expect(keys).toContain("a");
      expect(keys).toContain("b");
      expect(keys).toContain("c");
      expect(keys).not.toContain("other");
    });
  });

  describe("edge cases", () => {
    it("should handle localStorage getItem error by returning default", () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("Error");
      });
      const value = storage.get("key", "default");
      expect(value).toBe("default");
    });

    it("should handle localStorage removeItem error gracefully", () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error("Error");
      });
      expect(() => storage.remove("key")).not.toThrow();
    });

    it("should handle localStorage clear error gracefully", () => {
      const keys = ["test_a"];
      vi.spyOn(Object, "keys").mockReturnValue(keys);
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error("Error");
      });
      expect(() => storage.clear()).not.toThrow();
    });

    it("should handle localStorage keys error gracefully", () => {
      const keysSpy = vi.spyOn(Object, "keys").mockImplementationOnce(() => {
        throw new Error("Error");
      });
      const result = storage.keys();
      expect(result).toEqual([]);
      expect(keysSpy).toHaveBeenCalled();
    });
  });
});