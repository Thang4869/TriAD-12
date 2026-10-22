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

    this.updateTotal(null);
  }

  updateTotal(total) {
    if (this.totalElement) {
      this.totalElement.textContent = total === null ? "—" : formatPrice(total);
    }
  }

  renderQuoteStatus(message) {
    this.updateTotal(null);
    for (const id of [
      "checkout-subtotal",
      "checkout-tax",
      "checkout-shipping",
      "checkout-discount",
    ]) {
      const element = document.getElementById(id);
      if (element) element.textContent = "—";
    }
    const status = document.getElementById("checkout-quote-status");
    if (status) status.textContent = message;
  }

  renderQuote(quote) {
    const fields = [
      ["checkout-subtotal", quote.subtotal],
      ["checkout-tax", quote.tax],
      ["checkout-shipping", quote.shippingFee],
      ["checkout-discount", quote.discountAmount],
    ];
    for (const [id, value] of fields) {
      const element = document.getElementById(id);
      if (element) element.textContent = formatPrice(value);
    }
    this.updateTotal(quote.total);
    const status = document.getElementById("checkout-quote-status");
    if (status)
      status.textContent =
        "Tổng tiền đã bao gồm thuế, phí giao hàng và giảm giá áp dụng.";
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
