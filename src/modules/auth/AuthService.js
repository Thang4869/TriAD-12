import { apiService } from "../../shared/services/api.service.js";
import { setCsrfToken, clearCsrfToken } from "../../shared/utils/csrf.js";
import { eventBus } from "../../core/services/EventBus.js";
import { EVENTS } from "../../shared/constants/Events.js";

const CURRENT_USER_KEY = "triad_current_user";

/**
 * AuthService quản lý trạng thái đăng nhập của người dùng.
 *
 * QUAN TRỌNG: service này KHÔNG lưu access token (backend set httpOnly
 * cookie, JS không đọc được và không cần đọc — trình duyệt tự gửi kèm mọi
 * request nhờ credentials:'include'). Chỉ lưu THÔNG TIN HIỂN THỊ của user
 * (id, email, tên) vào sessionStorage để UI (header) biết "đang đăng nhập
 * là ai" ngay cả sau khi refresh trang, KHÔNG phải để xác thực.
 *
 * Yêu cầu backend: patch authMiddleware để chấp nhận accessToken từ cookie
 * (xem ghi chú đã gửi trước đó) - nếu chưa patch, mọi gọi tới cart/checkout/
 * orders sau khi login vẫn sẽ trả 401.
 */
export class AuthService {
  constructor(api = apiService) {
    this.api = api;
    this.currentUser = this._loadPersistedUser();
  }

  _loadPersistedUser() {
    try {
      const raw = sessionStorage.getItem(CURRENT_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  _persistUser(user) {
    this.currentUser = user;
    if (user) {
      sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  get isAuthenticated() {
    return this.currentUser !== null;
  }

  async register({ email, password, firstName, lastName, phone }) {
    // Không tự đăng nhập sau khi đăng ký: backend yêu cầu xác minh email trước.
    return this.api.post("/auth/register", {
      email,
      password,
      firstName,
      lastName,
      phone,
    });
  }

  async login(email, password) {
    const result = await this.api.post("/auth/login", { email, password });

    if (result?.requires2FA) {
      return {
        requires2FA: true,
        preAuthToken: result.preAuthToken,
        message: result.message,
      };
    }

    setCsrfToken(result.csrfToken);
    this._persistUser(result.user);
    eventBus.emit(EVENTS.AUTH_LOGIN, { user: result.user });

    return { user: result.user };
  }

  async logout() {
    try {
      await this.api.post("/auth/logout", {});
    } finally {
      clearCsrfToken();
      this._persistUser(null);
      eventBus.emit(EVENTS.AUTH_LOGOUT);
    }
  }

  async refresh() {
    const result = await this.api.post("/auth/refresh", {});

    setCsrfToken(result.csrfToken);
    this._persistUser(result.user);

    return result.user;
  }

  async restoreCsrfToken() {
    if (!this.isAuthenticated) {
      clearCsrfToken();
      return;
    }

    try {
      const result = await this.api.get("/auth/csrf");
      setCsrfToken(result.csrfToken);
    } catch {
      clearCsrfToken();
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }
}

export const authService = new AuthService();
