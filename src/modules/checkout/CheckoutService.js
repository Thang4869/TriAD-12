import { apiService } from "../../shared/services/api.service.js";
import { EVENTS } from "../../shared/constants/Events.js";
import { eventBus } from "../../core/services/EventBus.js";

/**
 * Gọi POST /api/checkout kèm header "Idempotency-Key" (UUID được giữ nguyên trong cùng một checkout attempt) để chống double-submit khi mạng chậm/user bấm nhiều lần - khớp
 * idempotency.middleware.ts bên backend.
 */
export class CheckoutService {
  constructor(api = apiService) {
    this.api = api;
  }

  async checkout(
    { paymentMethod, address, phone, notes, discountCode, expectedTotal },
    idempotencyKey,
  ) {
    const result = await this.api.post(
      "/checkout",
      { paymentMethod, address, phone, notes, discountCode, expectedTotal },
      { "Idempotency-Key": idempotencyKey },
    );
    eventBus.emit(EVENTS.CHECKOUT_COMPLETED, { order: result.order });
    return result.order;
  }

  async getOrders(page = 1, limit = 10) {
    return this.api.get("/checkout/orders", { page, limit });
  }

  async getQuote(discountCode) {
    const quote = await this.api.get("/checkout/quote", { discountCode });
    const fields = [
      "subtotal",
      "tax",
      "shippingFee",
      "discountAmount",
      "total",
    ];
    if (
      !quote ||
      fields.some(
        (field) => !Number.isSafeInteger(quote[field]) || quote[field] < 0,
      )
    ) {
      throw new Error("Invalid checkout quote");
    }
    return quote;
  }

  async getOrder(orderId) {
    return this.api.get(`/checkout/orders/${orderId}`);
  }
}
