import { formatPrice } from "../../shared/utils/helpers.js";

export class CheckoutRenderer {
  constructor() {
    this.itemsContainer = document.getElementById("checkout-items");
    this.totalElement = document.getElementById("checkout-total");
  }

  renderSummary(items) {
    if (!this.itemsContainer) return;
    if (!items || items.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "text-gray-500";
      emptyMessage.textContent = "Your cart is empty.";
      this.itemsContainer.replaceChildren(emptyMessage);
      this.updateTotal(0);
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "item-row flex justify-between text-sm py-1";

      const name = document.createElement("span");
      name.textContent = `${item.name} x${item.quantity}`;

      const subtotal = document.createElement("span");
      subtotal.textContent = formatPrice(item.subtotal);

      row.append(name, subtotal);
      fragment.append(row);
    });
    this.itemsContainer.replaceChildren(fragment);

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const shipping = total >= 500000 ? 0 : 30000;
    this.updateTotal(total + shipping);
  }

  updateTotal(total) {
    if (this.totalElement) {
      this.totalElement.textContent = formatPrice(total);
    }
  }

  renderSuccessPricing(order) {
    const fields = [
      ["success-subtotal", order.subtotal],
      ["success-tax", order.tax],
      ["success-shipping", order.shippingFee],
      ["success-discount", order.discountAmount],
      ["success-total", order.total],
    ];

    fields.forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = formatPrice(value);
    });

    const discountCode = document.getElementById("success-discount-code");
    if (discountCode) {
      discountCode.textContent = order.discountCode
        ? `(${order.discountCode})`
        : "";
    }
  }
}
