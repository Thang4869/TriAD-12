import { describe, it, expect } from "vitest";
import { CartItemModel } from "../../../../src/shared/models/CartItemModel.js";

describe("CartItemModel", () => {
  const productData = {
    id: 1,
    name: "Test Product",
    color: "White",
    price: 100000,
    image: "test.jpg",
    filter: "",
  };

  describe("constructor", () => {
    it("should create instance with default quantity 1 when not provided", () => {
      const item = new CartItemModel(productData);
      expect(item.quantity).toBe(1);
      expect(item.id).toBe(1);
    });

    it("should create instance with given quantity and ensure minimum 1", () => {
      const item1 = new CartItemModel(productData, 3);
      expect(item1.quantity).toBe(3);

      const item2 = new CartItemModel(productData, 0);
      expect(item2.quantity).toBe(1);
    });
  });

  describe("getters", () => {
    it("should compute subtotal correctly", () => {
      const item = new CartItemModel(productData, 3);
      expect(item.subtotal).toBe(300000);
    });

    it("should return formatted subtotal with currency", () => {
      const item = new CartItemModel(productData, 3);
      expect(item.formattedSubtotal).toBe("300.000 ₫");
    });
  });

  describe("quantity operations", () => {
    it("should increment quantity by default amount (1)", () => {
      const item = new CartItemModel(productData, 1);
      const newItem = item.increment();
      expect(newItem.quantity).toBe(2);
    });

    it("should increment quantity by custom amount", () => {
      const item = new CartItemModel(productData, 1);
      const newItem = item.increment(3);
      expect(newItem.quantity).toBe(4);
    });

    it("should decrement quantity by default amount (1)", () => {
      const item = new CartItemModel(productData, 3);
      const newItem = item.decrement();
      expect(newItem.quantity).toBe(2);
    });

    it("should decrement quantity by custom amount", () => {
      const item = new CartItemModel(productData, 5);
      const newItem = item.decrement(2);
      expect(newItem.quantity).toBe(3);
    });

    it("should not decrement below 1", () => {
      const item = new CartItemModel(productData, 1);
      expect(item.decrement().quantity).toBe(1);
      expect(item.decrement(5).quantity).toBe(1);
    });

    it("withQuantity should return same instance when new quantity equals current", () => {
      const item = new CartItemModel(productData, 5);
      const same = item.withQuantity(5);
      expect(same).toBe(item);
    });

    it("withQuantity should return a new instance when quantity changes", () => {
      const item = new CartItemModel(productData, 5);
      const changed = item.withQuantity(7);
      expect(changed).not.toBe(item);
      expect(changed.quantity).toBe(7);
    });
  });

  describe("serialization", () => {
    it("should serialize to JSON including product fields, quantity and subtotal", () => {
      const item = new CartItemModel(productData, 2);
      const json = item.toJSON();
      expect(json).toEqual({
        ...productData,
        quantity: 2,
        subtotal: 200000,
      });
    });

    it("should deserialize from JSON with quantity present", () => {
      const data = {
        ...productData,
        quantity: 4,
        subtotal: 400000,
      };
      const item = CartItemModel.fromJSON(data);
      expect(item).toBeInstanceOf(CartItemModel);
      expect(item.quantity).toBe(4);
      expect(item.subtotal).toBe(400000);
    });

    it("should deserialize from JSON with default quantity 1 when missing", () => {
      const data = { ...productData };
      const item = CartItemModel.fromJSON(data);
      expect(item.quantity).toBe(1);
    });
  });
});