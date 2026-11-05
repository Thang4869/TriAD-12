import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthController } from "../../../../src/modules/auth/AuthController.js";
import { ApiError } from "../../../../src/shared/services/api.service.js";
import { authService } from "../../../../src/modules/auth/AuthService.js";
import { eventBus } from "../../../../src/core/services/EventBus.js";

vi.mock("../../../../src/modules/auth/AuthService.js", () => ({
  authService: {
    isAuthenticated: false,
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    expireSession: vi.fn(),
  },
}));

vi.mock("../../../../src/core/services/EventBus.js", () => ({
  eventBus: {
    on: vi.fn(),
  },
}));

const renderAuthDom = () => {
  document.body.innerHTML = `
    <button id="account-btn"><span id="account-btn-label"></span></button>
    <button id="mobile-account-btn"></button>
    <button id="close-auth-btn"></button>
    <a id="auth-switch-mode"></a>
    <span id="auth-switch-text"></span>
    <form id="auth-form">
      <input id="auth-email" value="  user@example.com  ">
      <input id="auth-password" value="secret">
      <input id="auth-first-name" value=" First ">
      <input id="auth-last-name" value=" Last ">
      <input id="auth-phone" value=" 0900000000 ">
      <div id="auth-register-fields"></div>
      <button id="auth-submit-btn"></button>
    </form>
    <h2 id="auth-modal-title"></h2>
    <div id="auth-error" class="hidden text-red-600"></div>
    <div id="auth-modal" class="hidden opacity-0">
      <div class="bg-white scale-95"></div>
    </div>
    <a id="admin-nav-link"></a>
    <a id="mobile-admin-nav-link"></a>
  `;
};

describe("AuthController", () => {
  let controller;

  beforeEach(() => {
    vi.clearAllMocks();
    renderAuthDom();

    authService.isAuthenticated = false;
    authService.register.mockResolvedValue({});
    authService.login.mockResolvedValue({
      user: { email: "user@example.com", firstName: "User" },
    });
    authService.logout.mockResolvedValue(undefined);
    authService.getCurrentUser.mockReturnValue(null);

    window.toast = {
      success: vi.fn(),
      info: vi.fn(),
    };
    vi.stubGlobal("requestAnimationFrame", (callback) => callback());
    controller = new AuthController();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete window.toast;
  });

  it("subscribes to auth events and refreshes the header or expires the session", () => {
    expect(eventBus.on).toHaveBeenCalledTimes(3);

    const listeners = Object.fromEntries(
      eventBus.on.mock.calls.map(([event, callback]) => [event, callback]),
    );
    const updateSpy = vi.spyOn(controller, "updateHeaderUI");
    listeners["auth:login"]();
    listeners["auth:logout"]();
    listeners["auth:expired"]();

    expect(updateSpy).toHaveBeenCalledTimes(2);
    expect(authService.expireSession).toHaveBeenCalledOnce();
  });

  it("wires account, close, mode-switch, submit, and mobile account controls", () => {
    const openSpy = vi.spyOn(controller, "open");
    const closeSpy = vi.spyOn(controller, "close");
    const submitSpy = vi
      .spyOn(controller, "handleSubmit")
      .mockResolvedValue(undefined);

    document.getElementById("account-btn").click();
    expect(openSpy).toHaveBeenCalledWith("login");

    document.getElementById("close-auth-btn").click();
    expect(closeSpy).toHaveBeenCalledOnce();

    document.getElementById("auth-switch-mode").click();
    expect(controller.mode).toBe("register");

    document
      .getElementById("auth-form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(submitSpy).toHaveBeenCalledOnce();

    const accountClick = vi.spyOn(
      document.getElementById("account-btn"),
      "click",
    );
    document.getElementById("mobile-account-btn").click();
    expect(accountClick).toHaveBeenCalledOnce();
  });

  it("logs out from the account control when already authenticated", () => {
    authService.isAuthenticated = true;
    const logoutSpy = vi
      .spyOn(controller, "handleLogout")
      .mockResolvedValue(undefined);

    document.getElementById("account-btn").click();

    expect(logoutSpy).toHaveBeenCalledOnce();
  });

  it("opens and closes the modal while updating body scroll state", () => {
    const modal = document.getElementById("auth-modal");
    const content = modal.querySelector(".bg-white");

    controller.open("register", vi.fn());

    expect(controller.mode).toBe("register");
    expect(modal.classList.contains("hidden")).toBe(false);
    expect(modal.classList.contains("opacity-0")).toBe(false);
    expect(content.classList.contains("scale-95")).toBe(false);
    expect(document.body.style.overflow).toBe("hidden");

    vi.useFakeTimers();
    controller.close();

    expect(modal.classList.contains("opacity-0")).toBe(true);
    expect(content.classList.contains("scale-95")).toBe(true);
    expect(document.body.style.overflow).toBe("");
    expect(document.getElementById("auth-error").classList.contains("hidden")).toBe(
      true,
    );

    vi.advanceTimersByTime(300);
    expect(modal.classList.contains("hidden")).toBe(true);
  });

  it("does not fail to open or close when the modal is absent", () => {
    document.getElementById("auth-modal").remove();

    expect(() => controller.open()).not.toThrow();
    expect(() => controller.close()).not.toThrow();
  });

  it("switches between login and registration labels and clears prior errors", () => {
    const error = document.getElementById("auth-error");
    error.textContent = "Previous error";
    error.classList.remove("hidden");

    controller.setMode("register");
    expect(document.getElementById("auth-modal-title").textContent).toBe(
      "Tạo tài khoản",
    );
    expect(
      document.getElementById("auth-register-fields").classList.contains("hidden"),
    ).toBe(false);
    expect(document.getElementById("auth-submit-btn").textContent).toBe("Đăng ký");
    expect(document.getElementById("auth-switch-text").textContent).toBe(
      "Đã có tài khoản?",
    );
    expect(document.getElementById("auth-switch-mode").textContent).toBe(
      "Đăng nhập",
    );
    expect(error.textContent).toBe("");
    expect(error.classList.contains("hidden")).toBe(true);

    controller.setMode("login");
    expect(document.getElementById("auth-modal-title").textContent).toBe(
      "Đăng nhập",
    );
    expect(
      document.getElementById("auth-register-fields").classList.contains("hidden"),
    ).toBe(true);
    expect(document.getElementById("auth-submit-btn").textContent).toBe(
      "Đăng nhập",
    );
    expect(document.getElementById("auth-switch-text").textContent).toBe(
      "Chưa có tài khoản?",
    );
    expect(document.getElementById("auth-switch-mode").textContent).toBe(
      "Đăng ký ngay",
    );
  });

  it("registers with trimmed profile fields and shows the server message", async () => {
    authService.register.mockResolvedValue({ message: "Check your inbox" });
    controller.setMode("register");

    await controller.handleSubmit({ preventDefault: vi.fn() });

    expect(authService.register).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret",
      firstName: "First",
      lastName: "Last",
      phone: "0900000000",
    });
    expect(document.getElementById("auth-error").textContent).toBe(
      "Check your inbox",
    );
    expect(document.getElementById("auth-error").classList.contains("text-green-600")).toBe(
      true,
    );
    expect(document.getElementById("auth-submit-btn").disabled).toBe(false);
  });

  it("uses the default registration message and returns to login after the delay", async () => {
    vi.useFakeTimers();
    authService.register.mockResolvedValue({});
    controller.setMode("register");

    await controller.handleSubmit({ preventDefault: vi.fn() });

    expect(document.getElementById("auth-error").textContent).toContain(
      "Đăng ký thành công",
    );
    vi.advanceTimersByTime(1500);
    expect(controller.mode).toBe("login");
  });

  it("shows a registration error and always re-enables the submit button", async () => {
    authService.register.mockRejectedValue(new ApiError("Email exists", 409));
    controller.setMode("register");

    await controller.handleSubmit({ preventDefault: vi.fn() });

    expect(document.getElementById("auth-error").textContent).toBe("Email exists");
    expect(document.getElementById("auth-submit-btn").disabled).toBe(false);
  });

  it("shows the unsupported two-factor flow without closing the modal", async () => {
    authService.login.mockResolvedValue({
      requires2FA: true,
      preAuthToken: "pre-auth",
    });

    await controller.handleSubmit({ preventDefault: vi.fn() });

    expect(document.getElementById("auth-error").textContent).toContain("2FA");
    expect(document.getElementById("auth-modal").classList.contains("hidden")).toBe(
      true,
    );
    expect(document.getElementById("auth-submit-btn").disabled).toBe(false);
  });

  it("closes after login and invokes a pending action exactly once", async () => {
    const pending = vi.fn();
    controller.open("login", pending);

    await controller.handleSubmit({ preventDefault: vi.fn() });

    expect(authService.login).toHaveBeenCalledWith(
      "user@example.com",
      "secret",
    );
    expect(window.toast.success).toHaveBeenCalledWith(
      "Đăng nhập thành công",
      "Chào mừng User!",
    );
    expect(pending).toHaveBeenCalledOnce();
    expect(controller._pendingAction).toBeNull();
  });

  it("uses the email when the logged-in user has no first name", async () => {
    authService.login.mockResolvedValue({
      user: { email: "fallback@example.com" },
    });

    await controller.handleSubmit({ preventDefault: vi.fn() });

    expect(window.toast.success).toHaveBeenCalledWith(
      "Đăng nhập thành công",
      "Chào mừng fallback@example.com!",
    );
  });

  it("shows ApiError messages but hides unexpected error details", async () => {
    authService.login.mockRejectedValueOnce(new ApiError("Invalid password", 401));

    await controller.handleSubmit({ preventDefault: vi.fn() });
    expect(document.getElementById("auth-error").textContent).toBe(
      "Invalid password",
    );

    authService.login.mockRejectedValueOnce(new Error("Database internals"));
    await controller.handleSubmit({ preventDefault: vi.fn() });
    expect(document.getElementById("auth-error").textContent).toBe(
      "Có lỗi xảy ra, vui lòng thử lại.",
    );
    expect(document.getElementById("auth-submit-btn").disabled).toBe(false);
  });

  it("logs out and displays the informational toast", async () => {
    await controller.handleLogout();

    expect(authService.logout).toHaveBeenCalledOnce();
    expect(window.toast.info).toHaveBeenCalledWith(
      "Đã đăng xuất",
      "Hẹn gặp lại!",
    );
  });

  it("updates guest and user header states, including admin links", () => {
    const account = document.getElementById("account-btn");
    const label = document.getElementById("account-btn-label");
    const admin = document.getElementById("admin-nav-link");
    const mobileAdmin = document.getElementById("mobile-admin-nav-link");

    controller.updateHeaderUI();
    expect(label.textContent).toBe("Đăng nhập");
    expect(account.title).toBe("Đăng nhập");
    expect(admin.classList.contains("hidden")).toBe(true);
    expect(mobileAdmin.classList.contains("hidden")).toBe(true);

    authService.getCurrentUser.mockReturnValue({
      email: "admin@example.com",
      role: "ADMIN",
    });
    controller.updateHeaderUI();
    expect(label.textContent).toBe("admin@example.com");
    expect(account.title).toBe("Đăng xuất");
    expect(admin.classList.contains("hidden")).toBe(false);
    expect(mobileAdmin.classList.contains("hidden")).toBe(false);

    authService.getCurrentUser.mockReturnValue({
      firstName: "Admin",
      email: "admin@example.com",
      role: "USER",
    });
    controller.updateHeaderUI();
    expect(label.textContent).toBe("Admin");
    expect(admin.classList.contains("hidden")).toBe(true);
    expect(mobileAdmin.classList.contains("hidden")).toBe(true);
  });

  it("returns early from header update when the account button is missing", () => {
    document.getElementById("account-btn").remove();
    expect(() => controller.updateHeaderUI()).not.toThrow();
    expect(authService.getCurrentUser).not.toHaveBeenCalled();
  });

  it("runs protected actions immediately for authenticated users", () => {
    authService.isAuthenticated = true;
    const action = vi.fn();

    controller.requireAuth(action);

    expect(action).toHaveBeenCalledOnce();
    expect(window.toast.info).not.toHaveBeenCalled();
  });

  it("prompts guests to log in before running a protected action", () => {
    const action = vi.fn();
    const openSpy = vi.spyOn(controller, "open");

    controller.requireAuth(action);

    expect(window.toast.info).toHaveBeenCalledWith(
      "Cần đăng nhập",
      "Vui lòng đăng nhập để tiếp tục.",
    );
    expect(openSpy).toHaveBeenCalledWith("login", action);
  });

  it("tolerates a page without auth controls", () => {
    document.body.innerHTML = "";

    expect(() => new AuthController()).not.toThrow();
  });
});
