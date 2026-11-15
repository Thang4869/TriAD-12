import { CheckoutService } from "../checkout/CheckoutService.js";

/**
 * Order reads intentionally use the checkout API's write-side repository.
 * This keeps the customer-facing history consistent with a just-committed
 * checkout while the asynchronous order-history projection catches up.
 */
export class OrdersService {
  constructor(checkoutService = new CheckoutService()) {
    this.checkoutService = checkoutService;
  }

  async getOrders(page = 1, limit = 10) {
    return this.checkoutService.getOrders(page, limit);
  }

  async getOrder(orderId) {
    if (!orderId || typeof orderId !== "string") {
      throw new TypeError("A valid order ID is required");
    }

    return this.checkoutService.getOrder(orderId);
  }
}
