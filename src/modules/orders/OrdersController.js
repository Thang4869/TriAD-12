import { ApiError } from "../../shared/services/api.service.js";
import { OrdersService } from "./OrdersService.js";
import { OrdersRenderer } from "./OrdersRenderer.js";

const PAGE_SIZE = 10;

export class OrdersController {
  constructor(
    service = new OrdersService(),
    renderer = new OrdersRenderer(),
  ) {
    this.service = service;
    this.renderer = renderer;
    this.page = 1;
    this.orderId = new URLSearchParams(window.location.search).get("orderId");
  }

  async init() {
    if (this.orderId) {
      await this.loadDetail();
      return;
    }

    await this.loadList();
  }

  async loadList(page = this.page) {
    this.page = Math.max(1, Number(page) || 1);
    this.renderer.renderLoading();

    try {
      const response = await this.service.getOrders(this.page, PAGE_SIZE);
      this.renderer.renderList(response, (nextPage) => {
        void this.loadList(nextPage);
      });
    } catch (error) {
      this.renderer.renderError(this.getErrorMessage(error), "Thử lại", () => {
        void this.loadList(this.page);
      });
    }
  }

  async loadDetail() {
    if (!this.orderId) {
      this.renderer.renderError("Không tìm thấy mã đơn hàng trong đường dẫn.", "Về lịch sử đơn hàng", () => {
        window.location.href = "order-history.html";
      });
      return;
    }

    this.renderer.renderLoading("Đang tải chi tiết đơn hàng...");
    try {
      const order = await this.service.getOrder(this.orderId);
      this.renderer.renderDetail(order);
    } catch (error) {
      const message = error instanceof ApiError && error.status === 404
        ? "Đơn hàng không tồn tại hoặc không thuộc tài khoản của bạn."
        : this.getErrorMessage(error);
      this.renderer.renderError(message, "Thử lại", () => {
        void this.loadDetail();
      });
    }
  }

  getErrorMessage(error) {
    if (error instanceof ApiError) {
      if (error.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem đơn hàng.";
      if (error.status === 403) return "Tài khoản hiện không có quyền xem thông tin đơn hàng này.";
      if (error.status === 404) return "Không tìm thấy đơn hàng.";
      if (error.status === 0) return "Không thể kết nối máy chủ. Kiểm tra mạng rồi thử lại.";
      return error.message || "Không thể tải dữ liệu đơn hàng.";
    }
    return "Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.";
  }
}
