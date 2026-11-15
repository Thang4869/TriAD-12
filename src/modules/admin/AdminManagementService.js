import { apiService } from "../../shared/services/api.service.js";

export class AdminManagementService {
  constructor(api = apiService) {
    this.api = api;
  }

  getOrders(page = 1, limit = 20) {
    return this.api.get("/orders/admin/all", { page, limit });
  }

  updateOrderStatus(orderId, status) {
    return this.api.patch(`/orders/admin/${orderId}/status`, { status });
  }

  getReviews(page = 1, limit = 20) {
    return this.api.get("/reviews/admin/all", { page, limit });
  }

  deleteReview(reviewId) {
    return this.api.delete(`/reviews/${reviewId}`);
  }

  getAuditLogs(page = 1, limit = 50) {
    return this.api.get("/admin/audit-logs", { page, limit });
  }
}
