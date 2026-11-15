import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({ isAuthenticated: true }));
vi.mock("../../../../src/modules/auth/AuthService.js", () => ({
  authService: {
    get isAuthenticated() {
      return authState.isAuthenticated;
    },
  },
}));

import { ProfileController } from "../../../../src/modules/profile/ProfileController.js";
import { eventBus } from "../../../../src/core/services/EventBus.js";
import { EVENTS } from "../../../../src/shared/constants/Events.js";
import { ApiError } from "../../../../src/shared/services/api.service.js";

describe("ProfileController", () => {
  let service;
  let renderer;

  beforeEach(() => {
    authState.isAuthenticated = true;
    document.body.innerHTML = '<div id="profile-view"></div>';
    service = {
      getProfile: vi.fn().mockResolvedValue({ id: "user-1", firstName: "An" }),
      updateProfile: vi.fn(),
    };
    renderer = {
      renderLoading: vi.fn(),
      renderProfile: vi.fn(),
      renderError: vi.fn(),
      renderLoginRequired: vi.fn(),
    };
  });

  afterEach(() => {
    eventBus.clear();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("does nothing when the profile page is not mounted", async () => {
    document.body.innerHTML = "";
    const controller = new ProfileController(service, renderer);

    await controller.init();

    expect(service.getProfile).not.toHaveBeenCalled();
    expect(renderer.renderLoading).not.toHaveBeenCalled();
  });

  it("renders the login-required state for signed-out visitors", async () => {
    authState.isAuthenticated = false;
    const controller = new ProfileController(service, renderer);

    await controller.init();

    expect(renderer.renderLoginRequired).toHaveBeenCalledWith(expect.any(Function));
    expect(service.getProfile).not.toHaveBeenCalled();
  });

  it("opens login and retries initialization after successful login", async () => {
    const open = vi.fn();
    window.authController = { open };
    const controller = new ProfileController(service, renderer);

    await controller.init();
    const onLogin = renderer.renderLoginRequired.mock.calls[0][0];
    onLogin();

    expect(open).toHaveBeenCalledWith("login", expect.any(Function));
    await open.mock.calls[0][1]();
    expect(service.getProfile).toHaveBeenCalledOnce();
    delete window.authController;
  });

  it("loads and renders the current profile for authenticated users", async () => {
    const profile = { id: "user-1", firstName: "An" };
    service.getProfile.mockResolvedValue(profile);
    const controller = new ProfileController(service, renderer);

    await controller.init();

    expect(renderer.renderLoading).toHaveBeenCalledOnce();
    expect(renderer.renderProfile).toHaveBeenCalledWith(profile, expect.any(Function));
    const onSave = renderer.renderProfile.mock.calls[0][1];
    await onSave({ firstName: "Binh" });
    expect(service.updateProfile).toHaveBeenCalledWith({ firstName: "Binh" });
  });

  it("shows a session-expired message for API 401", async () => {
    service.getProfile.mockRejectedValue(new ApiError("Unauthorized", 401));
    const controller = new ProfileController(service, renderer);

    await controller.init();

    expect(renderer.renderError).toHaveBeenCalledWith(
      "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      expect.any(Function),
    );
  });

  it("shows the API message for other failures and retries on request", async () => {
    service.getProfile.mockRejectedValue(new Error("Network unavailable"));
    const controller = new ProfileController(service, renderer);

    await controller.init();

    expect(renderer.renderError).toHaveBeenCalledWith(
      "Network unavailable",
      expect.any(Function),
    );
    const retry = renderer.renderError.mock.calls[0][1];
    service.getProfile.mockResolvedValue({ id: "user-1" });
    await retry();
    expect(service.getProfile).toHaveBeenCalledTimes(2);
  });

  it("uses a fallback message when the failure has no message", async () => {
    service.getProfile.mockRejectedValue({});
    const controller = new ProfileController(service, renderer);

    await controller.init();

    expect(renderer.renderError).toHaveBeenCalledWith(
      "Không thể tải thông tin hồ sơ.",
      expect.any(Function),
    );
  });

  it("reloads the profile after an authentication event only when mounted", async () => {
    const controller = new ProfileController(service, renderer);
    eventBus.emit(EVENTS.AUTH_LOGIN);
    await Promise.resolve();

    expect(service.getProfile).toHaveBeenCalledOnce();
    expect(renderer.renderProfile).toHaveBeenCalledOnce();

    document.body.innerHTML = "";
    eventBus.emit(EVENTS.AUTH_LOGIN);
    await Promise.resolve();
    expect(service.getProfile).toHaveBeenCalledOnce();
    controller.init = vi.fn();
  });
});
