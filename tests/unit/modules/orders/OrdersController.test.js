import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../../src/shared/services/api.service.js";
import { OrdersController } from "../../../../src/modules/orders/OrdersController.js";

describe("OrdersController", () => {
  let service;
  let renderer;

  beforeEach(() => {
    service = {
      getOrders: vi.fn().mockResolvedValue({ orders: [], page: 1, totalPages: 1 }),
      getOrder: vi.fn(),
    };
    renderer = {
      renderLoading: vi.fn(),
      renderList: vi.fn(),
      renderDetail: vi.fn(),
      renderError: vi.fn(),
      renderEmpty: vi.fn(),
    };
    window.history.replaceState({}, "", "/pages/order-history.html");
  });

  it("loads the first history page on initialization", async () => {
    const controller = new OrdersController(service, renderer);
    await controller.init();

    expect(service.getOrders).toHaveBeenCalledWith(1, 10);
    expect(renderer.renderList).toHaveBeenCalledWith(
      { orders: [], page: 1, totalPages: 1 },
      expect.any(Function),
    );
  });

  it("uses the requested page and clamps invalid page numbers", async () => {
    const controller = new OrdersController(service, renderer);
    await controller.loadList(0);

    expect(service.getOrders).toHaveBeenCalledWith(1, 10);
  });

  it("renders a clear session-expired state for 401", async () => {
    service.getOrders.mockRejectedValue(new ApiError("Unauthorized", 401));
    const controller = new OrdersController(service, renderer);
    await controller.init();

    expect(renderer.renderError).toHaveBeenCalledWith(
      "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem đơn hàng.",
      "Thử lại",
      expect.any(Function),
    );
  });

  it("loads the authoritative order detail from the query string", async () => {
    window.history.replaceState({}, "", "/pages/order-detail.html?orderId=order-1");
    const order = { id: "order-1" };
    service.getOrder.mockResolvedValue(order);
    const controller = new OrdersController(service, renderer);
    await controller.init();

    expect(service.getOrder).toHaveBeenCalledWith("order-1");
    expect(renderer.renderDetail).toHaveBeenCalledWith(order);
  });

  it("shows a safe not-found message for 404 order details", async () => {
    window.history.replaceState({}, "", "/pages/order-detail.html?orderId=missing");
    service.getOrder.mockRejectedValue(new ApiError("Not found", 404));
    const controller = new OrdersController(service, renderer);
    await controller.init();

    expect(renderer.renderError).toHaveBeenCalledWith(
      "Đơn hàng không tồn tại hoặc không thuộc tài khoản của bạn.",
      "Thử lại",
      expect.any(Function),
    );
  });
});
