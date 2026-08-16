import { describe, it, expect, vi, beforeEach } from "vitest";
import { CartService } from "../../../../src/modules/cart/CartService.js";
import { ProductModel } from "../../../../src/shared/models/ProductModel.js";
import { eventBus } from "../../../../src/core/services/EventBus.js";
import { CartRepository } from "../../../../src/modules/cart/CartRepository.js";

vi.mock("../../../../src/modules/cart/CartRepository.js", () => ({
  CartRepository: vi.fn(),
}));

vi.mock("../../../../src/core/services/EventBus.js", () => ({
  eventBus: {
    emit: vi.fn(),
  },
}));

describe("CartService", () => {
  let service;
  let mockRepo;
  let mockProduct;

  const createMockProduct = (id, name = "Product", price = 100000) =>
    new ProductModel({
      id,
      name,
      color: "White",
      price,
      image: "a.jpg",
    });

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepo = {
      findAll: vi.fn().mockReturnValue([]),
      save: vi.fn(),
      clear: vi.fn(),
    };

    const MockCartRepository = vi.mocked(CartRepository);
    MockCartRepository.mockImplementation(() => mockRepo);

    service = new CartService();
    mockProduct = createMockProduct(1, "Product A", 100000);
  });

  describe("constructor & load", () => {
    it("should load items from repository and notify on construction", () => {
      expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.stringContaining("cart:updated"),
        expect.objectContaining({
          items: [],
          total: 0,
          count: 0,
          isEmpty: true,
        })
      );
    });

    it("should load existing items from repository", () => {
      const existingItems = [
        { id: 1, name: "A", price: 100, quantity: 2, subtotal: 200, image: "", color: "White" },
      ];
      mockRepo.findAll.mockReturnValueOnce(existingItems);

      service = new CartService();

      expect(service.items).toHaveLength(1);
      expect(service.items[0].id).toBe(1);
      expect(service.count).toBe(2);
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.stringContaining("cart:updated"),
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ id: 1, quantity: 2 }),
          ]),
          total: 200,
          count: 2,
          isEmpty: false,
        })
      );
    });
  });

  describe("add", () => {
    it("should add a new product to cart", () => {
      const result = service.add(mockProduct, 2);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].quantity).toBe(2);
      expect(service.count).toBe(2);
      expect(service.total).toBe(200000);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
      expect(eventBus.emit).toHaveBeenCalledWith(
        "cart:item:added",
        { product: mockProduct, quantity: 2 }
      );
    });

    it("should increment quantity if product already exists", () => {
      service.add(mockProduct, 1);
      mockRepo.save.mockClear();
      eventBus.emit.mockClear();

      service.add(mockProduct, 3);

      expect(service.items).toHaveLength(1);
      expect(service.items[0].quantity).toBe(4);
      expect(service.count).toBe(4);
      expect(service.total).toBe(400000);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
      expect(eventBus.emit).toHaveBeenCalledWith(
        "cart:item:added",
        { product: mockProduct, quantity: 3 }
      );
    });

    it("should default quantity to 1 if not provided", () => {
      service.add(mockProduct);
      expect(service.items[0].quantity).toBe(1);
      expect(service.count).toBe(1);
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("should remove an existing item by id", () => {
      service.add(mockProduct, 1);
      mockRepo.save.mockClear();
      eventBus.emit.mockClear();

      service.remove(1);

      expect(service.items).toHaveLength(0);
      expect(service.count).toBe(0);
      expect(service.isEmpty).toBe(true);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
      expect(eventBus.emit).toHaveBeenCalledWith(
        "cart:item:removed",
        { id: 1 }
      );
    });

    it("should do nothing if id not found", () => {
      service.add(mockProduct, 1);
      const prevItems = [...service.items];
      mockRepo.save.mockClear();
      eventBus.emit.mockClear();

      service.remove(999);

      expect(service.items).toEqual(prevItems);
      expect(mockRepo.save).not.toHaveBeenCalled();
      expect(eventBus.emit).not.toHaveBeenCalledWith(
        "cart:item:removed",
        expect.anything()
      );
    });
  });

  describe("increase", () => {
    it("should increase quantity of an existing item", () => {
      service.add(mockProduct, 1);
      mockRepo.save.mockClear();

      service.increase(1);

      expect(service.items[0].quantity).toBe(2);
      expect(service.count).toBe(2);
      expect(service.total).toBe(200000);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it("should return items unchanged if id not found", () => {
      service.add(mockProduct, 1);
      const originalItems = service.items;
      mockRepo.save.mockClear();

      const result = service.increase(999);

      expect(result).toBe(service.items);
      expect(service.items).toEqual(originalItems);
      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("decrease", () => {
    it("should decrease quantity when quantity > 1", () => {
      service.add(mockProduct, 3);
      mockRepo.save.mockClear();

      service.decrease(1);

      expect(service.items[0].quantity).toBe(2);
      expect(service.count).toBe(2);
      expect(service.total).toBe(200000);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it("should remove item when quantity is 1", () => {
      service.add(mockProduct, 1);
      mockRepo.save.mockClear();

      service.decrease(1);

      expect(service.items).toHaveLength(0);
      expect(service.count).toBe(0);
      expect(service.total).toBe(0);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it("should return items unchanged if id not found", () => {
      service.add(mockProduct, 1);
      const originalItems = service.items;
      mockRepo.save.mockClear();

      const result = service.decrease(999);

      expect(result).toBe(service.items);
      expect(service.items).toEqual(originalItems);
      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("clear", () => {
    it("should remove all items and clear repository", () => {
      service.add(mockProduct, 2);
      mockRepo.save.mockClear();
      eventBus.emit.mockClear();

      service.clear();

      expect(service.items).toHaveLength(0);
      expect(service.count).toBe(0);
      expect(service.total).toBe(0);
      expect(service.isEmpty).toBe(true);
      expect(mockRepo.clear).toHaveBeenCalledTimes(1);
      expect(mockRepo.save).not.toHaveBeenCalled();
      expect(eventBus.emit).toHaveBeenCalledWith("cart:cleared");
    });
  });

  describe("getters", () => {
    beforeEach(() => {
      service.add(mockProduct, 2);
      service.add(createMockProduct(2, "Product B", 50000), 3);
    });

    it("total should sum subtotals", () => {
      expect(service.total).toBe(2 * 100000 + 3 * 50000);
    });

    it("count should sum quantities", () => {
      expect(service.count).toBe(2 + 3);
    });

    it("isEmpty should be false when items exist", () => {
      expect(service.isEmpty).toBe(false);
    });

    it("isEmpty should be true when items empty", () => {
      service.clear();
      expect(service.isEmpty).toBe(true);
    });
  });

  describe("save and notify", () => {
    it("save should call repository.save and notify", () => {
      service.add(mockProduct, 1);
      mockRepo.save.mockClear();
      eventBus.emit.mockClear();

      service.save();

      expect(mockRepo.save).toHaveBeenCalledWith(service.items);
      expect(eventBus.emit).toHaveBeenCalledWith(
        "cart:updated",
        expect.objectContaining({
          items: service.items,
          total: service.total,
          count: service.count,
          isEmpty: service.isEmpty,
        })
      );
    });

    it("notify should emit CART_UPDATED with current state", () => {
      service.add(mockProduct, 1);
      eventBus.emit.mockClear();

      service.notify();

      expect(eventBus.emit).toHaveBeenCalledWith(
        "cart:updated",
        expect.objectContaining({
          items: service.items,
          total: service.total,
          count: service.count,
          isEmpty: service.isEmpty,
        })
      );
    });
  });
});