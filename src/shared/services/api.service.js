import { APP_CONFIG } from "../../config/settings.config.js";
import { getCsrfToken, readSameOriginCsrfCookie } from "../utils/csrf.js";
import { eventBus } from "../../core/services/EventBus.js";
import { EVENTS } from "../constants/Events.js";

export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

/**
 * ApiService - lớp giao tiếp HTTP duy nhất với backend DNEK.
 *
 * Auth: backend dùng JWT lưu trong cookie httpOnly (accessToken, refreshToken),
 * KHÔNG trả token qua JSON để JS đọc (đúng chuẩn bảo mật, tránh XSS đánh cắp
 * token). Vì vậy request luôn gửi credentials: 'include' để trình duyệt tự
 * đính kèm cookie — không cần và không thể tự set header Authorization từ JS.
 *
 * Các request POST/PUT/PATCH/DELETE tự động đính kèm header "x-csrf-token"
 * từ cookie không-httpOnly "csrfToken" hiện tại khi API cùng origin để tránh
 * lệch token giữa các tab. Nếu không đọc được cookie, dùng token JSON đã nhận
 * từ API; không đọc cookie của frontend để bổ sung header cho API khác origin.
 */
export class ApiService {
  constructor(baseURL = APP_CONFIG.API_BASE_URL) {
    this.baseURL = baseURL;
  }

  _buildUrl(endpoint, params) {
    let url = `${this.baseURL}${endpoint}`;
    if (params && Object.keys(params).length > 0) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.set(key, value);
        }
      });
      const qs = query.toString();
      if (qs) url += `?${qs}`;
    }
    return url;
  }

  async _request(method, endpoint, { params, body, headers = {} } = {}) {
    const url = this._buildUrl(endpoint, params);
    const finalHeaders = { "Content-Type": "application/json", ...headers };
    const csrfAtStart =
      readSameOriginCsrfCookie(this.baseURL) ?? getCsrfToken();

    if (!["GET", "HEAD"].includes(method)) {
      if (csrfAtStart) finalHeaders["x-csrf-token"] = csrfAtStart;
    }

    let response;
    try {
      response = await fetch(url, {
        method,
        headers: finalHeaders,
        credentials: "include",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (networkError) {
      throw new ApiError(
        "Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng.",
        0,
        null,
      );
    }

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : null;

    if (!response.ok) {
      let message =
        (typeof payload?.error === "string" && payload.error.trim()) ||
        (typeof payload?.message === "string" && payload.message.trim()) ||
        `Yêu cầu thất bại (mã lỗi ${response.status})`;
      if (response.status === 401 && !endpoint.startsWith("/auth/")) {
        message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        // A late response from an older session must not sign out a newer one.
        // Auth bootstrap/refresh own their recovery; never replay a failed write.
        const currentCsrf =
          readSameOriginCsrfCookie(this.baseURL) ?? getCsrfToken();
        if (currentCsrf === csrfAtStart) eventBus.emit(EVENTS.AUTH_EXPIRED);
      } else if (
        response.status === 403 &&
        payload?.error === "Invalid or missing CSRF token"
      ) {
        message =
          "Phiên bảo mật không còn hợp lệ. Vui lòng tải lại trang rồi thử lại.";
      }
      throw new ApiError(message, response.status, payload);
    }

    if (payload && Object.prototype.hasOwnProperty.call(payload, "data")) {
      return payload.data;
    }
    return payload;
  }

  get(endpoint, params) {
    return this._request("GET", endpoint, { params });
  }
  post(endpoint, body, headers) {
    return this._request("POST", endpoint, { body, headers });
  }
  put(endpoint, body) {
    return this._request("PUT", endpoint, { body });
  }
  patch(endpoint, body) {
    return this._request("PATCH", endpoint, { body });
  }
  delete(endpoint) {
    return this._request("DELETE", endpoint);
  }
}

export const apiService = new ApiService();
