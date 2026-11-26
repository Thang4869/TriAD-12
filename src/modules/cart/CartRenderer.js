import { formatPrice } from "../../shared/utils/helpers.js";

const IMAGE_BASE_URL = "https://triad.invalid";

function getSafeImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  const candidate = value.trim();
  if (/[\x00-\x20\x7f<>"']/.test(candidate) || candidate.startsWith("//")) {
    return null;
  }

  try {
    const parsed = new URL(candidate, IMAGE_BASE_URL);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!/^https?:\/\//i.test(candidate) && parsed.origin !== IMAGE_BASE_URL) {
      return null;
    }
    return candidate;
  } catch {
    return null;
  }
}

function appendTextElement(parent, tagName, className, value) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = value == null ? "" : String(value);
  parent.appendChild(element);
  return element;
}

function createActionButton(className, action, id, label) {
  const button = document.createElement("button");
  button.className = className;
  button.dataset.action = action;
  button.dataset.id = id;
  button.textContent = label;
  return button;
}

export class CartRenderer {
  constructor() {
    this.container = document.querySelector(".cart-scroll");
    this.totalElement = document.getElementById("cart-total");
    this.checkoutBtn = document.getElementById("checkout-btn");
  }

  render(items) {
    if (!this.container) return;

    this.container.replaceChildren();

    if (!items || items.length === 0) {
      this.renderEmpty();
      this.updateTotal(0);
      this.updateBadge(0);
      return;
    }

    items.forEach((item) => {
      this.container.appendChild(this.createItemElement(item));
    });

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    this.updateTotal(total);
    this.updateBadge(items.reduce((sum, item) => sum + item.quantity, 0));
  }

  createItemElement(item) {
    const id = item.id == null ? "" : String(item.id);
    const div = document.createElement("div");
    div.className = "flex gap-4 border-b border-gray-100 pb-6";
    div.dataset.id = id;

    const imageWrapper = document.createElement("div");
    imageWrapper.className =
      "w-20 h-24 bg-gray-50 rounded flex items-center justify-center overflow-hidden";

    const image = document.createElement("img");
    image.className = "w-full h-full object-contain";
    const safeImageUrl = getSafeImageUrl(item.image);
    if (safeImageUrl) image.setAttribute("src", safeImageUrl);
    image.setAttribute("alt", item.name == null ? "" : String(item.name));

    const filterClasses =
      typeof item.filter === "string"
        ? item.filter
            .split(/\s+/)
            .filter((name) => /^[A-Za-z_][A-Za-z0-9_-]*$/.test(name))
        : [];
    image.classList.add(...filterClasses);
    imageWrapper.appendChild(image);

    const content = document.createElement("div");
    content.className = "flex-1";

    const header = document.createElement("div");
    header.className = "flex justify-between";

    const details = document.createElement("div");
    appendTextElement(details, "h3", "text-sm font-medium", item.name);
    appendTextElement(details, "p", "text-gray-500", formatPrice(item.price));

    const removeButton = createActionButton(
      "text-gray-400 hover:text-red-500 transition-colors remove-btn",
      "remove",
      id,
      "",
    );
    const trashIcon = document.createElement("i");
    trashIcon.className = "ph ph-trash text-lg";
    removeButton.appendChild(trashIcon);
    header.append(details, removeButton);

    const footer = document.createElement("div");
    footer.className = "flex justify-between mt-4 items-center";

    const quantityControls = document.createElement("div");
    quantityControls.className = "flex items-center border rounded";
    quantityControls.appendChild(
      createActionButton(
        "px-3 py-1 hover:bg-gray-100 transition-colors decrease-btn",
        "decrease",
        id,
        "-",
      ),
    );
    appendTextElement(
      quantityControls,
      "span",
      "px-4 min-w-[32px] text-center",
      item.quantity,
    );
    quantityControls.appendChild(
      createActionButton(
        "px-3 py-1 hover:bg-gray-100 transition-colors increase-btn",
        "increase",
        id,
        "+",
      ),
    );

    footer.append(quantityControls);
    appendTextElement(footer, "strong", "", formatPrice(item.subtotal));

    content.append(header, footer);
    div.append(imageWrapper, content);
    return div;
  }

  renderEmpty() {
    const emptyState = document.createElement("div");
    emptyState.className = "text-center py-20";

    const icon = document.createElement("i");
    icon.className = "ph ph-shopping-cart text-6xl text-gray-300";
    emptyState.appendChild(icon);

    appendTextElement(
      emptyState,
      "p",
      "mt-4 text-gray-500",
      "The shopping cart is empty.",
    );
    this.container.replaceChildren(emptyState);
  }

  updateBadge(count) {
    const badge = document.getElementById("cart-badge");
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "flex" : "none";
    }
  }

  updateTotal(total) {
    if (this.totalElement) {
      this.totalElement.textContent = formatPrice(total);
    }
  }

  setCheckoutEnabled(enabled) {
    if (this.checkoutBtn) {
      this.checkoutBtn.disabled = !enabled;
      this.checkoutBtn.style.opacity = enabled ? "1" : "0.5";
    }
  }
}
