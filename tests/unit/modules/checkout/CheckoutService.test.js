import { beforeEach, describe, expect, it, vi } from "vitest";
import { CheckoutService } from "../../../../src/modules/checkout/CheckoutService.js";
import { eventBus } from "../../../../src/core/services/EventBus.js";
import { EVENTS } from "../../../../src/shared/constants/Events.js";

vi.mock("../../../../src/core/services/EventBus.js", () => ({
  eventBus: {
    emit: vi.fn(),
  },
}));

describe("CheckoutService", () => {
  let api;
  let service;

  beforeEach(() => {
    vi.clearAllMocks();

    api = {
      post: vi.fn(),
      get: vi.fn(),
    };

    service = new CheckoutService(api);
  });

  describe("checkout", () => {
    it("sends the provided idempotency key to the checkout API", async () => {
      const order = {
        id: "order-1",
        orderNumber: "ORD-1",
      };

      api.post.mockResolvedValue({ order });

      const data = {
        paymentMethod: "COD",
        address: "123 Test Street",
        phone: "0123456789",
        notes: "Test note",
        discountCode: undefined,
      };

      const result = await service.checkout(data, "checkout-attempt-123");

      expect(api.post).toHaveBeenCalledWith("/checkout", data, {
        "Idempotency-Key": "checkout-attempt-123",
      });

      expect(result).toEqual(order);
    });

    it("does not generate or replace the provided idempotency key", async () => {
      api.post.mockResolvedValue({
        order: {
          id: "order-1",
          orderNumber: "ORD-1",
        },
      });

      const randomUUID = vi.spyOn(crypto, "randomUUID");

      await service.checkout(
        {
          paymentMethod: "COD",
          address: "123 Test Street",
          phone: "0123456789",
        },
        "same-checkout-key",
      );

      expect(randomUUID).not.toHaveBeenCalled();

      randomUUID.mockRestore();
    });

    it("emits CHECKOUT_COMPLETED after a successful checkout", async () => {
      const order = {
        id: "order-1",
        orderNumber: "ORD-1",
      };

      api.post.mockResolvedValue({ order });

      await service.checkout(
        {
          paymentMethod: "COD",
          address: "123 Test Street",
          phone: "0123456789",
        },
        "checkout-key",
      );

      expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.CHECKOUT_COMPLETED, {
        order,
      });
    });

    it("does not emit CHECKOUT_COMPLETED when checkout fails", async () => {
      api.post.mockRejectedValue(new Error("network failure"));

      await expect(
        service.checkout(
          {
            paymentMethod: "COD",
            address: "123 Test Street",
            phone: "0123456789",
          },
          "checkout-key",
        ),
      ).rejects.toThrow("network failure");

      expect(eventBus.emit).not.toHaveBeenCalled();
    });
  });

  describe("getOrders", () => {
    it("loads paginated checkout orders", async () => {
      const response = {
        orders: [],
        page: 2,
        limit: 5,
      };

      api.get.mockResolvedValue(response);

      await expect(service.getOrders(2, 5)).resolves.toEqual(response);

      expect(api.get).toHaveBeenCalledWith("/checkout/orders", {
        page: 2,
        limit: 5,
      });
    });
  });

  describe("getOrder", () => {
    it("loads an order by id", async () => {
      const order = {
        id: "order-1",
        orderNumber: "ORD-1",
      };

      api.get.mockResolvedValue(order);

      await expect(service.getOrder("order-1")).resolves.toEqual(order);

      expect(api.get).toHaveBeenCalledWith("/checkout/orders/order-1");
    });
  });
});
