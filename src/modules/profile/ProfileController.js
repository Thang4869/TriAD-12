import { ApiError } from "../../shared/services/api.service.js";
import { authService } from "../auth/AuthService.js";
import { ProfileService } from "./ProfileService.js";
import { ProfileRenderer } from "./ProfileRenderer.js";
import { eventBus } from "../../core/services/EventBus.js";
import { EVENTS } from "../../shared/constants/Events.js";

export class ProfileController {
  constructor(service = new ProfileService(), renderer = new ProfileRenderer()) {
    this.service = service;
    this.renderer = renderer;
    eventBus.on(EVENTS.AUTH_LOGIN, () => {
      if (document.getElementById("profile-view")) void this.init();
    });
  }

  async init() {
    if (!document.getElementById("profile-view")) return;
    if (!authService.isAuthenticated) {
      this.renderer.renderLoginRequired(() => {
        window.authController?.open("login", () => void this.init());
      });
      return;
    }

    this.renderer.renderLoading();
    try {
      const profile = await this.service.getProfile();
      this.renderer.renderProfile(profile, (data) => this.service.updateProfile(data));
    } catch (error) {
      const message = error instanceof ApiError && error.status === 401
        ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        : error?.message || "Không thể tải thông tin hồ sơ.";
      this.renderer.renderError(message, () => void this.init());
    }
  }
}
