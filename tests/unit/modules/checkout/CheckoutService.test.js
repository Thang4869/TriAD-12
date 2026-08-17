import { describe, it, expect, vi, beforeEach } from "vitest";
import { CheckoutService } from "../../../../src/modules/checkout/CheckoutService.js";
import { Order } from "../../../../src/shared/models/index.js";
import { storage } from "../../../../src/core/services/Storage.js";
import { eventBus } from "../../../../src/core/services/EventBus.js";
import { EVENTS } from "../../../../src/shared/constants/Events.js";

vi.mock("../../../../src/core/services/Storage.js", () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock("../../../../src/core/services/EventBus.js", () => ({
  eventBus: {
    emit: vi.fn(),
  },
}));

describe("CheckoutService", () => {
  let service;

  beforeEach(() => {
    vi.clearAllMocks();
    storage.get.mockReturnValue([]);
    service = new CheckoutService();
  });

  describe("Initialization and Loading", () => {
    it("should initialize and load empty orders successfully", () => {
      expect(service.getOrders()).toEqual([]);
      expect(storage.get).toHaveBeenCalledWith("orders", []);
    });

    it("should load existing orders from storage and instantiate Order models", () => {
      const mockOrders = [
        { id: "ORD-1", items: [], customer: {}, total: 100000 },
        { id: "ORD-2", items: [], customer: {}, total: 200000 },
      ];
      storage.get.mockReturnValue(mockOrders);

      const orders = service.loadOrders();
      expect(orders.length).toBe(2);
      expect(orders[0]).toBeInstanceOf(Order);
      expect(orders[1]).toBeInstanceOf(Order);
    });
  });

  describe("Order Management", () => {
    it("should return a copied array of orders via getOrders", () => {
      const orderData = { items: [], customer: { name: "Test" }, total: 100000 };
      service.createOrder(orderData);

      const orders1 = service.getOrders();
      const orders2 = service.getOrders();
      expect(orders1).toEqual(orders2);
      expect(orders1).not.toBe(orders2);
    });

    it("should create order, save to storage, and emit completion event", () => {
      const orderData = {
        items: [],
        customer: { name: "John Doe" },
        total: 150000,
      };

      const order = service.createOrder(orderData);
      expect(order).toBeInstanceOf(Order);
      expect(service.getOrders().length).toBe(1);
      expect(storage.set).toHaveBeenCalled();
      expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.CHECKOUT_COMPLETED, { order });
    });

    it("should find order by id or return null if not found", () => {
      const orderData = { items: [], customer: { name: "John" }, total: 100000 };
      const order = service.createOrder(orderData);

      const found = service.getOrderById(order.id);
      expect(found).toBe(order);

      const notFoundNonEmpty = service.getOrderById("non-existent-id");
      expect(notFoundNonEmpty).toBeNull();

      service.orders = [];
      const notFoundEmpty = service.getOrderById(order.id);
      expect(notFoundEmpty).toBeNull();
    });
  });

describe("Checkout Processing", () => {
    it("should process checkout with shipping fee when total is below threshold", () => {
      const formData = {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        phone: "0987654321",
        address: "456 Side St",
        paymentMethod: "cod",
      };

      const cartItems = [
        {
          id: 1,
          name: "Item",
          price: 200000,
          quantity: 1,
          subtotal: 200000,
          image: "img.jpg",
          color: "Black",
          filter: "",
        },
      ];

      const order = service.processCheckout(formData, cartItems);
      expect(order).toBeInstanceOf(Order);
      expect(order.total).toBe(200000);
      expect(storage.set).toHaveBeenCalled();
    });

    it("should process checkout without shipping fee when total meets or exceeds threshold", () => {
      const formData = {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        phone: "0987654321",
        address: "456 Side St",
        paymentMethod: "cod",
      };

      const cartItems = [
        {
          id: 1,
          name: "Item",
          price: 600000,
          quantity: 1,
          subtotal: 600000,
          image: "img.jpg",
          color: "Black",
          filter: "",
        },
      ];

      const order = service.processCheckout(formData, cartItems);
      expect(order).toBeInstanceOf(Order);
      expect(order.total).toBe(600000);
      expect(storage.set).toHaveBeenCalled();
    });
  });
});