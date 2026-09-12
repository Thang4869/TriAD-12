import { authService } from "./AuthService.js";
import { ApiError } from "../../shared/services/api.service.js";
import { eventBus } from "../../core/services/EventBus.js";
import { EVENTS } from "../../shared/constants/Events.js";

/**
 * Điều khiển modal đăng nhập/đăng ký (pages/auth-modal.html).
 * Sau khi đăng nhập thành công, phát EVENTS.AUTH_LOGIN và gọi lại
 * callback `_pendingAction` (nếu có) — dùng khi CartController/CheckoutController
 * mở modal này để "yêu cầu đăng nhập trước khi thao tác".
 */
export class AuthController {
  constructor() {
    this.mode = "login"; // "login" | "register"
    this._pendingAction = null;
    this.setupEventListeners();
    this.updateHeaderUI();

    eventBus.on(EVENTS.AUTH_LOGIN, () => this.updateHeaderUI());
    eventBus.on(EVENTS.AUTH_LOGOUT, () => this.updateHeaderUI());
  }

  setupEventListeners() {
    document.getElementById("account-btn")?.addEventListener("click", () => {
      if (authService.isAuthenticated) {
        this.handleLogout();
      } else {
        this.open("login");
      }
    });

    document
      .getElementById("close-auth-btn")
      ?.addEventListener("click", () => this.close());

    document
      .getElementById("auth-switch-mode")
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        this.setMode(this.mode === "login" ? "register" : "login");
      });

    document.getElementById("auth-form")?.addEventListener("submit", (e) => {
      this.handleSubmit(e);
    });
  }

  /** Mở modal. `onSuccess` (tuỳ chọn) được gọi lại ngay sau khi đăng nhập xong. */
  open(mode = "login", onSuccess = null) {
    this._pendingAction = onSuccess;
    this.setMode(mode);

    const modal = document.getElementById("auth-modal");
    if (!modal) return;
    const content = modal.querySelector(".bg-white");
    modal.classList.remove("hidden");
    requestAnimationFrame(() => {
      modal.classList.remove("opacity-0");
      content?.classList.remove("scale-95");
    });
    document.body.style.overflow = "hidden";
  }

  close() {
    const modal = document.getElementById("auth-modal");
    if (!modal) return;
    const content = modal.querySelector(".bg-white");
    modal.classList.add("opacity-0");
    content?.classList.add("scale-95");
    setTimeout(() => modal.classList.add("hidden"), 300);
    document.body.style.overflow = "";
    this._clearError();
  }

  setMode(mode) {
    this.mode = mode;
    const title = document.getElementById("auth-modal-title");
    const registerFields = document.getElementById("auth-register-fields");
    const submitBtn = document.getElementById("auth-submit-btn");
    const switchText = document.getElementById("auth-switch-text");
    const switchLink = document.getElementById("auth-switch-mode");

    if (mode === "register") {
      if (title) title.textContent = "Tạo tài khoản";
      registerFields?.classList.remove("hidden");
      if (submitBtn) submitBtn.textContent = "Đăng ký";
      if (switchText) switchText.textContent = "Đã có tài khoản?";
      if (switchLink) switchLink.textContent = "Đăng nhập";
    } else {
      if (title) title.textContent = "Đăng nhập";
      registerFields?.classList.add("hidden");
      if (submitBtn) submitBtn.textContent = "Đăng nhập";
      if (switchText) switchText.textContent = "Chưa có tài khoản?";
      if (switchLink) switchLink.textContent = "Đăng ký ngay";
    }
    this._clearError();
  }

  async handleSubmit(e) {
    e.preventDefault();
    this._clearError();

    const email = document.getElementById("auth-email")?.value.trim();
    const password = document.getElementById("auth-password")?.value;

    const submitBtn = document.getElementById("auth-submit-btn");
    if (submitBtn) submitBtn.disabled = true;

    try {
      if (this.mode === "register") {
        const firstName = document.getElementById("auth-first-name")?.value.trim();
        const lastName = document.getElementById("auth-last-name")?.value.trim();
        const phone = document.getElementById("auth-phone")?.value.trim();

        const result = await authService.register({
          email,
          password,
          firstName,
          lastName,
          phone,
        });
        this._showInfo(result.message || "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.");
        setTimeout(() => this.setMode("login"), 1500);
        return;
      }

      const result = await authService.login(email, password);

      if (result.requires2FA) {
        this._showInfo("Tài khoản của bạn bật 2FA — tính năng này chưa được hỗ trợ trên giao diện, vui lòng dùng ứng dụng khác.");
        return;
      }

      window.toast?.success("Đăng nhập thành công", `Chào mừng ${result.user.firstName || result.user.email}!`);
      this.close();

      const pending = this._pendingAction;
      this._pendingAction = null;
      if (typeof pending === "function") pending();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Có lỗi xảy ra, vui lòng thử lại.";
      this._showError(message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  async handleLogout() {
    await authService.logout();
    window.toast?.info("Đã đăng xuất", "Hẹn gặp lại!");
  }

  updateHeaderUI() {
    const btn = document.getElementById("account-btn");
    const label = document.getElementById("account-btn-label");
    if (!btn) return;
    const user = authService.getCurrentUser();
    if (label) {
      label.textContent = user ? (user.firstName || user.email) : "Đăng nhập";
    }
    btn.title = user ? "Đăng xuất" : "Đăng nhập";
  }

  _showError(message) {
    const el = document.getElementById("auth-error");
    if (el) {
      el.textContent = message;
      el.classList.remove("hidden");
    }
  }

  _showInfo(message) {
    const el = document.getElementById("auth-error");
    if (el) {
      el.textContent = message;
      el.classList.remove("hidden", "text-red-600");
      el.classList.add("text-green-600");
    }
  }

  _clearError() {
    const el = document.getElementById("auth-error");
    if (el) {
      el.textContent = "";
      el.classList.add("hidden");
      el.classList.remove("text-green-600");
      el.classList.add("text-red-600");
    }
  }

  /** Đảm bảo đã đăng nhập trước khi thực hiện `action`. Nếu chưa, mở modal login. */
  requireAuth(action) {
    if (authService.isAuthenticated) {
      action();
    } else {
      window.toast?.info("Cần đăng nhập", "Vui lòng đăng nhập để tiếp tục.");
      this.open("login", action);
    }
  }
}