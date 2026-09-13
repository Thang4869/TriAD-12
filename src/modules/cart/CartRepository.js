import { apiService } from "../../shared/services/api.service.js";
import { CartItem } from "../../shared/models/index.js";

/**
 * CartRepository gọi thẳng /api/cart (bắt buộc đăng nhập - xem cart.routes.ts
 * backend). Không kế thừa BaseRepository vì toàn bộ thao tác giờ bất đồng bộ.
 *
 * Chiến lược: sau MỌI thao tác ghi (add/update/remove/clear) đều gọi lại
 * GET /api/cart để lấy trạng thái mới nhất từ server, thay vì tự ghép dữ liệu
 * trả về của POST/PUT vào state cục bộ. Chậm hơn 1 request nhưng luôn đúng
 * 100% với server - tránh lệch dữ liệu khi có nhiều tab/thiết bị cùng sửa giỏ.
 */
export class CartRepository {
  constructor(api = apiService) {
    this.api = api;
  }

  async getCart() {
    const cart = await this.api.get("/cart");
    return (cart.items || []).map((item) => CartItem.fromApiItem(item));
  }

  async addItem(productId, quantity) {
    await this.api.post("/cart/items", { productId, quantity });
    return this.getCart();
  }

  async updateItem(productId, quantity) {
    await this.api.put(`/cart/items/${productId}`, { quantity });
    return this.getCart();
  }

  async removeItem(productId) {
    await this.api.delete(`/cart/items/${productId}`);
    return this.getCart();
  }

  async clear() {
    await this.api.delete("/cart");
    return [];
  }
}
