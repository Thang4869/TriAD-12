import { apiService } from "../../shared/services/api.service.js";

export class AdminService {
  constructor(api = apiService) {
    this.api = api;
  }

  getDashboardStats() {
    return this.api.get("/admin/dashboard/stats");
  }

  getOrders(filters = {}, page = 1, limit = 10) {
    const params = { page, limit };
    if (filters.status) params.status = filters.status;
    if (filters.userId) params.userId = filters.userId;
    return this.api.get("/orders/admin/all", params);
  }

  updateOrderStatus(orderId, status) {
    return this.api.patch(`/orders/admin/${orderId}/status`, { status });
  }

  getProducts(filters = {}, page = 1, limit = 10) {
    const params = { page, limit };
    if (filters.isActive !== undefined) params.isActive = filters.isActive;
    if (filters.category) params.category = filters.category;
    if (filters.keyword) params.keyword = filters.keyword;
    return this.api.get("/products/admin/all", params);
  }
}
