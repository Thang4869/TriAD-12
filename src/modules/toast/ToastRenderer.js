export class ToastRenderer {
  constructor() {
    this.container = this.getContainer();
    this.toasts = [];
    this.maxToasts = 4;
  }

  getContainer() {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className =
        "fixed top-20 right-4 z-50 space-y-2 pointer-events-none";
      document.body.appendChild(container);
    }
    return container;
  }

  createElement({
    title,
    message,
    type = "info",
    duration = 3000,
    icon = null,
  }) {
    const icons = {
      success: "ph-fill ph-check-circle",
      error: "ph-fill ph-x-circle",
      warning: "ph-fill ph-warning",
      info: "ph-fill ph-info",
    };

    const safeType = Object.hasOwn(icons, type) ? type : "info";
    const requestedIcon = icon || icons[safeType];
    const iconClass =
      typeof requestedIcon === "string" &&
      /^[a-zA-Z0-9_-]+(?:\s+[a-zA-Z0-9_-]+)*$/.test(requestedIcon)
        ? requestedIcon
        : icons.info;
    const safeDuration =
      Number.isFinite(Number(duration)) && Number(duration) >= 0
        ? Number(duration)
        : 3000;

    const wrapper = document.createElement("div");
    wrapper.classList.add("toast", `toast-${safeType}`);
    wrapper.setAttribute("role", "alert");
    wrapper.setAttribute("aria-live", "polite");
    wrapper.dataset.duration = String(safeDuration);

    const iconElement = document.createElement("i");
    iconElement.classList.add("ph", ...iconClass.split(/\s+/), "icon");

    const content = document.createElement("div");
    content.className = "content";

    const titleElement = document.createElement("div");
    titleElement.className = "title";
    titleElement.textContent = title == null ? "" : String(title);
    content.appendChild(titleElement);

    if (message) {
      const messageElement = document.createElement("div");
      messageElement.className = "message";
      messageElement.textContent = String(message);
      content.appendChild(messageElement);
    }

    const closeButton = document.createElement("button");
    closeButton.className = "close-btn";
    closeButton.setAttribute("aria-label", "Close notification");

    const closeIcon = document.createElement("i");
    closeIcon.className = "ph ph-x";
    closeButton.appendChild(closeIcon);

    const progress = document.createElement("div");
    progress.className = "progress-bar";
    progress.style.animationDuration = `${safeDuration}ms`;

    wrapper.append(iconElement, content, closeButton, progress);
    return wrapper;
  }

  render(toastData) {
    const existing = this.findDuplicate(toastData);
    if (existing) {
      return existing;
    }

    const element = this.createElement(toastData);
    this.container.appendChild(element);
    this.toasts.push(element);

    while (this.toasts.length > this.maxToasts) {
      const oldest = this.toasts.shift();
      this.remove(oldest);
    }

    return element;
  }

  findDuplicate({ title, message }) {
    return this.toasts.find(
      (t) =>
        t.querySelector(".title")?.textContent === title &&
        t.querySelector(".message")?.textContent === message,
    );
  }

  remove(element) {
    if (!element || !element.parentNode) return;

    element.classList.add("toast-exit");
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.toasts = this.toasts.filter((t) => t !== element);
    }, 300);
  }

  resetTimer(element) {
    const progress = element.querySelector(".progress-bar");
    if (progress) {
      progress.style.animation = "none";
      progress.offsetHeight;
      const duration = parseInt(element.dataset.duration) || 3000;
      progress.style.animation = `progress ${duration}ms linear forwards`;
    }
  }
}
