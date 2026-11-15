import { describe, expect, it, vi } from "vitest";
import { OrdersService } from "../../../../src/modules/orders/OrdersService.js";

describe("OrdersService", () => {
  it("uses the existing checkout read API for paginated history", async () => {
    const response = { orders: [], total: 0, page: 2, limit: 10, totalPages: 0 };
    const checkoutService = { getOrders: vi.fn().mockResolvedValue(response) };
    const service = new OrdersService(checkoutService);

    await expect(service.getOrders(2, 10)).resolves.toEqual(response);
    expect(checkoutService.getOrders).toHaveBeenCalledWith(2, 10);
  });

  it("loads order detail through the authenticated checkout endpoint", async () => {
    const order = { id: "order-1", orderNumber: "ORD-1" };
    const checkoutService = { getOrder: vi.fn().mockResolvedValue(order) };
    const service = new OrdersService(checkoutService);

    await expect(service.getOrder("order-1")).resolves.toEqual(order);
    expect(checkoutService.getOrder).toHaveBeenCalledWith("order-1");
  });

  it("rejects an empty order identifier before making a request", async () => {
    const checkoutService = { getOrder: vi.fn() };
    const service = new OrdersService(checkoutService);

    await expect(service.getOrder("")).rejects.toThrow("valid order ID");
    expect(checkoutService.getOrder).not.toHaveBeenCalled();
  });
});
