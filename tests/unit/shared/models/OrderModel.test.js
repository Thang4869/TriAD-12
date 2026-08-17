import { describe, it, expect } from "vitest";
import { OrderModel } from "../../../../src/shared/models/OrderModel.js";
import { CartItemModel } from "../../../../src/shared/models/CartItemModel.js";

describe("OrderModel", () => {
  const productData = {
    id: 1,
    name: "Product 1",
    color: "White",
    price: 100000,
    image: "img1.jpg",
    filter: "",
  };

  const createCartItem = (qty = 2) => new CartItemModel(productData, qty);

  const mockItemsPlain = [
    {
      id: 1,
      name: "Product 1",
      price: 100000,
      quantity: 2,
      subtotal: 200000,
      image: "img1.jpg",
      color: "White",
      filter: "",
    },
    {
      id: 2,
      name: "Product 2",
      price: 150000,
      quantity: 1,
      subtotal: 150000,
      image: "img2.jpg",
      color: "Black",
      filter: "",
    },
  ];

  describe("constructor", () => {
    it("should create order with default values when no args provided", () => {
      const order = new OrderModel();
      expect(order.id).toBeDefined();
      expect(order.items).toEqual([]);
      expect(order.customer).toEqual({});
      expect(order.paymentMethod).toBe("cod");
      expect(order.status).toBe("pending");
      expect(order.createdAt).toBeDefined();
    });

    it("should accept custom id and createdAt", () => {
      const customId = "ORD-CUSTOM-123";
      const customDate = "2026-01-01T00:00:00.000Z";
      const order = new OrderModel({
        id: customId,
        createdAt: customDate,
      });
      expect(order.id).toBe(customId);
      expect(order.createdAt).toBe(customDate);
    });

    it("should map items from plain objects to CartItemModel instances", () => {
      const order = new OrderModel({ items: mockItemsPlain });
      expect(order.items[0]).toBeInstanceOf(CartItemModel);
      expect(order.items[0].quantity).toBe(2);
    });

    it("should keep items as CartItemModel if already instances", () => {
      const cartItems = [createCartItem(3), createCartItem(1)];
      const order = new OrderModel({ items: cartItems });
      expect(order.items[0]).toBeInstanceOf(CartItemModel);
      expect(order.items[0].quantity).toBe(3);
    });
  });

  describe("getters", () => {
    let order;

    beforeEach(() => {
      order = new OrderModel({
        items: mockItemsPlain,
        customer: { name: "John Doe", email: "john@example.com" },
        paymentMethod: "card",
        status: "shipped",
      });
    });

    it("should return id, items, customer, paymentMethod, status, createdAt", () => {
      expect(order.id).toBeDefined();
      expect(order.items.length).toBe(2);
      expect(order.customer).toEqual({
        name: "John Doe",
        email: "john@example.com",
      });
      expect(order.paymentMethod).toBe("card");
      expect(order.status).toBe("shipped");
      expect(order.createdAt).toBeDefined();
    });

    it("should return a copy of items array", () => {
      const items = order.items;
      expect(items).not.toBe(order._items);
    });

    it("should return a copy of customer object", () => {
      const customer = order.customer;
      expect(customer).not.toBe(order._customer);
    });
  });

  describe("total", () => {
    it("should calculate total from items", () => {
      const order = new OrderModel({ items: mockItemsPlain });
      expect(order.total).toBe(350000);
    });

    it("should return 0 when items empty", () => {
      const order = new OrderModel({ items: [] });
      expect(order.total).toBe(0);
    });
  });

  describe("formattedTotal", () => {
    it("should format total with currency", () => {
      const order = new OrderModel({ items: mockItemsPlain });
      expect(order.formattedTotal).toBe("350.000 ₫");
    });

    it("should return '0 ₫' when total is 0", () => {
      const order = new OrderModel({ items: [] });
      expect(order.formattedTotal).toBe("0 ₫");
    });
  });

  describe("itemCount", () => {
    it("should sum quantities of all items", () => {
      const order = new OrderModel({ items: mockItemsPlain });
      expect(order.itemCount).toBe(3);
    });

    it("should return 0 when no items", () => {
      const order = new OrderModel({ items: [] });
      expect(order.itemCount).toBe(0);
    });
  });

  describe("generateId", () => {
    it("should generate an ID in format ORD-XXXXXX-XXXX", () => {
      const order = new OrderModel();
      const id = order.generateId();
      expect(id).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]+$/);
    });

    it("should generate unique IDs", () => {
      const order = new OrderModel();
      const id1 = order.generateId();
      const id2 = order.generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("serialization", () => {
    it("should convert to JSON including total", () => {
      const order = new OrderModel({
        items: mockItemsPlain,
        customer: { name: "John" },
        paymentMethod: "cod",
        status: "pending",
      });
      const json = order.toJSON();
      expect(json.id).toBe(order.id);
      expect(json.items.length).toBe(2);
      expect(json.total).toBe(350000);
      expect(json.customer).toEqual({ name: "John" });
    });

    it("should deserialize from JSON and recreate OrderModel", () => {
      const data = {
        id: "ORD-TEST-123",
        items: mockItemsPlain,
        customer: { name: "John" },
        paymentMethod: "cod",
        status: "pending",
        createdAt: new Date().toISOString(),
        total: 350000,
      };
      const order = OrderModel.fromJSON(data);
      expect(order).toBeInstanceOf(OrderModel);
      expect(order.id).toBe("ORD-TEST-123");
      expect(order.total).toBe(350000);
      expect(order.items[0]).toBeInstanceOf(CartItemModel);
    });
  });
});