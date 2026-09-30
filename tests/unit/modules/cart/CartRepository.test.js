import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartRepository } from "../../../../src/modules/cart/CartRepository.js";
import { CartItem } from "../../../../src/shared/models/index.js";

describe("CartRepository", () => {
  let api;
  let repository;

  const apiCartItem = (overrides = {}) => ({
    id: "cart-item-1",
    productId: "product-1",
    quantity: 2,
    product: {
      id: "product-1",
      name: "Product 1",
      price: 100000,
      images: ["1.jpg"],
    },
    ...overrides,
  });

  beforeEach(() => {
    api = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    repository = new CartRepository(api);
  });

  describe("getCart", () => {
    it("gets cart from backend and maps API items", async () => {
      api.get.mockResolvedValue({
        items: [apiCartItem()],
      });

      const items = await repository.getCart();

      expect(api.get).toHaveBeenCalledWith("/cart");
      expect(items).toHaveLength(1);
      expect(items[0]).toBeInstanceOf(CartItem);
      expect(items[0].id).toBe("product-1");
      expect(items[0].quantity).toBe(2);
    });

    it("returns empty array when backend cart has no items", async () => {
      api.get.mockResolvedValue({});

      const items = await repository.getCart();

      expect(items).toEqual([]);
    });
  });

  describe("addItem", () => {
    it("adds item then reloads cart from backend", async () => {
      api.post.mockResolvedValue({});
      api.get.mockResolvedValue({
        items: [apiCartItem()],
      });

      const items = await repository.addItem("product-1", 2);

      expect(api.post).toHaveBeenCalledWith("/cart/items", {
        productId: "product-1",
        quantity: 2,
      });

      expect(api.get).toHaveBeenCalledWith("/cart");
      expect(items).toHaveLength(1);
      expect(items[0]).toBeInstanceOf(CartItem);
    });
  });

  describe("updateItem", () => {
    it("updates item then reloads cart from backend", async () => {
      api.put.mockResolvedValue({});
      api.get.mockResolvedValue({
        items: [
          apiCartItem({
            quantity: 3,
          }),
        ],
      });

      const items = await repository.updateItem("product-1", 3);

      expect(api.put).toHaveBeenCalledWith("/cart/items/product-1", {
        quantity: 3,
      });

      expect(api.get).toHaveBeenCalledWith("/cart");
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(3);
    });
  });

  describe("removeItem", () => {
    it("removes item then reloads cart from backend", async () => {
      api.delete.mockResolvedValue({});
      api.get.mockResolvedValue({
        items: [],
      });

      const items = await repository.removeItem("product-1");

      expect(api.delete).toHaveBeenCalledWith("/cart/items/product-1");
      expect(api.get).toHaveBeenCalledWith("/cart");
      expect(items).toEqual([]);
    });
  });

  describe("clear", () => {
    it("clears backend cart and returns empty array", async () => {
      api.delete.mockResolvedValue({});

      const items = await repository.clear();

      expect(api.delete).toHaveBeenCalledWith("/cart");
      expect(items).toEqual([]);
      expect(api.get).not.toHaveBeenCalled();
    });
  });

  describe("errors", () => {
    it("propagates getCart API errors", async () => {
      api.get.mockRejectedValue(new Error("Unauthorized"));

      await expect(repository.getCart()).rejects.toThrow("Unauthorized");
    });

    it("does not reload cart when add request fails", async () => {
      api.post.mockRejectedValue(new Error("Add failed"));

      await expect(repository.addItem("product-1", 1)).rejects.toThrow(
        "Add failed",
      );

      expect(api.get).not.toHaveBeenCalled();
    });

    it("does not reload cart when update request fails", async () => {
      api.put.mockRejectedValue(new Error("Update failed"));

      await expect(repository.updateItem("product-1", 2)).rejects.toThrow(
        "Update failed",
      );

      expect(api.get).not.toHaveBeenCalled();
    });

    it("does not reload cart when remove request fails", async () => {
      api.delete.mockRejectedValue(new Error("Remove failed"));

      await expect(repository.removeItem("product-1")).rejects.toThrow(
        "Remove failed",
      );

      expect(api.get).not.toHaveBeenCalled();
    });
  });
});
