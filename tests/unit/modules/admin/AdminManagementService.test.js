import { describe, expect, it, vi } from "vitest";
import { AdminManagementService } from "../../../../src/modules/admin/AdminManagementService.js";

describe("AdminManagementService", () => {
  const createService = () => {
    const api = {
      get: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };
    return { service: new AdminManagementService(api), api };
  };

  it("loads paginated admin orders", () => {
    const { service, api } = createService();
    service.getOrders(2, 25);
    expect(api.get).toHaveBeenCalledWith("/orders/admin/all", { page: 2, limit: 25 });
  });

  it("updates an order through the protected admin endpoint", () => {
    const { service, api } = createService();
    service.updateOrderStatus("order-1", "PROCESSING");
    expect(api.patch).toHaveBeenCalledWith("/orders/admin/order-1/status", { status: "PROCESSING" });
  });

  it("loads paginated admin reviews and deletes a selected review", () => {
    const { service, api } = createService();
    service.getReviews(3, 15);
    service.deleteReview("review-1");
    expect(api.get).toHaveBeenCalledWith("/reviews/admin/all", { page: 3, limit: 15 });
    expect(api.delete).toHaveBeenCalledWith("/reviews/review-1");
  });

  it("loads audit records with a bounded page size", () => {
    const { service, api } = createService();
    service.getAuditLogs(1, 50);
    expect(api.get).toHaveBeenCalledWith("/admin/audit-logs", { page: 1, limit: 50 });
  });
});
