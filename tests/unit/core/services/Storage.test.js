import { describe, it, expect, vi, beforeEach } from "vitest";
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

  it("should set and get value", () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    storage.set("key", "value");
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "test_key",
      '"value"',
    );

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

describe("StorageService additional", () => {
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

  it("should fallback to memory if localStorage throws error on set", () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error("Quota exceeded");
    });
    const result = storage.set("key", "value");
    expect(result).toBe(false);
    expect(storage._memory.get("test_key")).toBe("value");
  });

  it("should get from memory if localStorage throws error on get", () => {
    vi.spyOn(storage, "_isAvailable").mockReturnValue(false);
    storage._memory.set("test_key", "memoryValue");

    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error("Error");
    });
    const value = storage.get("key", "default");
    expect(value).toBe("memoryValue");
  });

  it("should return default if key not in memory and localStorage fails", () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error("Error");
    });
    const value = storage.get("nonexistent", "default");
    expect(value).toBe("default");
  });

  it("should merge keys from localStorage and memory", () => {
    mockLocalStorage.getItem = vi.fn().mockReturnValue(null);
    vi.spyOn(Object, "keys").mockReturnValue(["test_a", "test_b", "other"]);
    storage._memory.set("test_c", "c");
    const keys = storage.keys();
    expect(keys).toContain("a");
    expect(keys).toContain("b");
    expect(keys).toContain("c");
    expect(keys).not.toContain("other");
  });

  it("should clear both localStorage and memory", () => {
    vi.spyOn(Object, "keys").mockReturnValue(["test_a", "test_b"]);
    storage._memory.set("test_c", "c");
    storage.clear();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(2);
    expect(storage._memory.size).toBe(0);
  });

  it("should handle localStorage not available in _isAvailable", () => {
    vi.spyOn(storage, "_isAvailable").mockReturnValue(false);
    storage.set("key", "value");
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    expect(storage._memory.get("test_key")).toBe("value");

    const val = storage.get("key");
    expect(val).toBe("value");
  });
});
