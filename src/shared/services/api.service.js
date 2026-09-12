import { APP_CONFIG } from "../../config/settings.config.js";
import { getCsrfToken } from "../utils/csrf.js";

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
 * (đọc từ cookie không-httpOnly "csrfToken") để qua được csrfProtection
 * middleware của các route như /auth/refresh, /auth/logout.
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

    if (!["GET", "HEAD"].includes(method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) finalHeaders["x-csrf-token"] = csrfToken;
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
      const message =
        payload?.message || `Yêu cầu thất bại (mã lỗi ${response.status})`;
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