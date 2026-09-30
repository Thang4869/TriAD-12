import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartService } from "../../../../src/modules/cart/CartService.js";
import { eventBus } from "../../../../src/core/services/EventBus.js";
import { EVENTS } from "../../../../src/shared/constants/Events.js";

vi.mock("../../../../src/core/services/EventBus.js", () => ({
  eventBus: {
    emit: vi.fn(),
  },
}));

describe("CartService", () => {
  let service;
  let repository;

  const item = (overrides = {}) => ({
    id: 1,
    productId: 1,
    name: "Product A",
    price: 100000,
    quantity: 1,
    subtotal: 100000,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    repository = {
      getCart: vi.fn().mockResolvedValue([]),
      addItem: vi.fn().mockResolvedValue([]),
      removeItem: vi.fn().mockResolvedValue([]),
      updateItem: vi.fn().mockResolvedValue([]),
      clear: vi.fn().mockResolvedValue(undefined),
    };

    service = new CartService(repository);
  });

  describe("load", () => {
    it("loads cart from repository and notifies", async () => {
      const items = [item()];
      repository.getCart.mockResolvedValue(items);

      const result = await service.load();

      expect(repository.getCart).toHaveBeenCalledTimes(1);
      expect(result).toEqual(items);
      expect(service.items).toEqual(items);
      expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.CART_UPDATED, {
        items,
        total: 100000,
        count: 1,
        isEmpty: false,
      });
    });

    it("uses an empty cart when repository load fails", async () => {
      repository.getCart.mockRejectedValue(new Error("Unauthorized"));

      const result = await service.load();

      expect(result).toEqual([]);
      expect(service.items).toEqual([]);
      expect(service.isEmpty).toBe(true);
      expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.CART_UPDATED, {
        items: [],
        total: 0,
        count: 0,
        isEmpty: true,
      });
    });
  });

  describe("add", () => {
    it("adds an item through repository", async () => {
      const items = [item({ quantity: 2, subtotal: 200000 })];
      repository.addItem.mockResolvedValue(items);

      const result = await service.add(1, 2);

      expect(repository.addItem).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual(items);
      expect(service.items).toEqual(items);
      expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.CART_ITEM_ADDED, {
        productId: 1,
        quantity: 2,
      });
    });

    it("uses quantity 1 by default", async () => {
      repository.addItem.mockResolvedValue([item()]);

      await service.add(1);

      expect(repository.addItem).toHaveBeenCalledWith(1, 1);
    });
  });

  describe("remove", () => {
    it("removes an item through repository", async () => {
      service.items = [item()];
      repository.removeItem.mockResolvedValue([]);

      const result = await service.remove(1);

      expect(repository.removeItem).toHaveBeenCalledWith(1);
      expect(result).toEqual([]);
      expect(service.items).toEqual([]);
      expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.CART_ITEM_REMOVED, {
        productId: 1,
      });
    });
  });

  describe("increase", () => {
    it("increments the current quantity", async () => {
      service.items = [item({ quantity: 2, subtotal: 200000 })];
      const updated = [item({ quantity: 3, subtotal: 300000 })];
      repository.updateItem.mockResolvedValue(updated);

      const result = await service.increase(1);

      expect(repository.updateItem).toHaveBeenCalledWith(1, 3);
      expect(result).toEqual(updated);
      expect(service.count).toBe(3);
    });

    it("uses quantity 1 when item is not currently loaded", async () => {
      repository.updateItem.mockResolvedValue([item()]);

      await service.increase(99);

      expect(repository.updateItem).toHaveBeenCalledWith(99, 1);
    });
  });

  describe("decrease", () => {
    it("decrements quantity when quantity is greater than 1", async () => {
      service.items = [item({ quantity: 3, subtotal: 300000 })];
      const updated = [item({ quantity: 2, subtotal: 200000 })];
      repository.updateItem.mockResolvedValue(updated);

      const result = await service.decrease(1);

      expect(repository.updateItem).toHaveBeenCalledWith(1, 2);
      expect(repository.removeItem).not.toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it("removes item when quantity reaches zero", async () => {
      service.items = [item({ quantity: 1 })];
      repository.removeItem.mockResolvedValue([]);

      const result = await service.decrease(1);

      expect(repository.removeItem).toHaveBeenCalledWith(1);
      expect(repository.updateItem).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("does nothing when item does not exist", async () => {
      service.items = [item()];

      const result = await service.decrease(999);

      expect(result).toBe(service.items);
      expect(repository.removeItem).not.toHaveBeenCalled();
      expect(repository.updateItem).not.toHaveBeenCalled();
    });
  });

  describe("clear", () => {
    it("clears repository and local cart", async () => {
      service.items = [item()];

      const result = await service.clear();

      expect(repository.clear).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
      expect(service.items).toEqual([]);
      expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.CART_CLEARED);
    });
  });

  describe("derived state", () => {
    it("calculates total, count and isEmpty", () => {
      service.items = [
        item({ id: 1, quantity: 2, subtotal: 200000 }),
        item({ id: 2, productId: 2, quantity: 3, subtotal: 150000 }),
      ];

      expect(service.total).toBe(350000);
      expect(service.count).toBe(5);
      expect(service.isEmpty).toBe(false);

      service.items = [];

      expect(service.total).toBe(0);
      expect(service.count).toBe(0);
      expect(service.isEmpty).toBe(true);
    });
  });

  describe("notify", () => {
    it("emits current cart state", () => {
      service.items = [item({ quantity: 2, subtotal: 200000 })];

      service.notify();

      expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.CART_UPDATED, {
        items: service.items,
        total: 200000,
        count: 2,
        isEmpty: false,
      });
    });
  });
});
