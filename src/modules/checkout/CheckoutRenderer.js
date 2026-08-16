import { formatPrice } from "../../shared/utils/helpers.js";

export class CheckoutRenderer {
  constructor() {
    this.itemsContainer = document.getElementById("checkout-items");
    this.totalElement = document.getElementById("checkout-total");
  }

  renderSummary(items) {
    if (!this.itemsContainer) return;
    if (!items || items.length === 0) {
      this.itemsContainer.innerHTML =
        '<p class="text-gray-500">Your cart is empty.</p>';
      this.updateTotal(0);
      return;
    }

    this.itemsContainer.innerHTML = items
      .map(
        (item) => `
      <div class="item-row flex justify-between text-sm py-1">
        <span>${item.name} x${item.quantity}</span>
        <span>${formatPrice(item.subtotal)}</span>
      </div>
    `,
      )
      .join("");

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const shipping = total >= 500000 ? 0 : 30000;
    this.updateTotal(total + shipping);
  }

  updateTotal(total) {
    if (this.totalElement) {
      this.totalElement.textContent = formatPrice(total);
    }
  }
}
