import { APP_CONFIG } from "../../config/settings.config.js";

/**
 * Lỗi chuẩn hoá cho mọi lời gọi API, để các Controller/Service phía trên
 * bắt lỗi bằng try/catch thông thường thay vì phải tự kiểm tra response.ok.
 */
export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status; // 0 = lỗi mạng (không tới được server)
    this.payload = payload; // body JSON gốc trả về từ backend (nếu có)
  }
}

/**
 * ApiService - lớp giao tiếp HTTP duy nhất với backend DNEK.
 *
 * Quy ước của backend (xem src/shared/middlewares/error-handler.middleware.ts
 * và các controller phía backend):
 *   - Thành công:  { success: true, data: ... }
 *   - Thất bại:    { success: false, message: "..." }  (kèm HTTP status lỗi)
 *
 * ApiService tự "bóc" field `data` ra, nên phía repository chỉ cần
 * `const product = await api.get('/products/123')` là nhận thẳng object product,
 * không phải object { success, data }.
 *
 * Auth: backend dùng JWT access token (Authorization header) + refresh token
 * qua httpOnly cookie, nên mọi request đều gửi kèm credentials: 'include'.
 * Khi frontend có module Auth (đăng nhập), gọi apiService.setAuthTokenProvider(fn)
 * để đính kèm access token vào header — hiện tại chưa có module Auth nên provider
 * mặc định trả về null (request đi như một guest/public request).
 */
export class ApiService {
  constructor(baseURL = APP_CONFIG.API_BASE_URL) {
    this.baseURL = baseURL;
    this._getAuthToken = () => null;
  }

  /**
   * Cho phép module Auth (khi được xây dựng) cắm vào cách lấy access token
   * hiện tại, ví dụ: apiService.setAuthTokenProvider(() => tokenStorage.getAccessToken())
   */
  setAuthTokenProvider(fn) {
    this._getAuthToken = typeof fn === "function" ? fn : () => null;
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

    const token = this._getAuthToken();
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
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

  post(endpoint, body) {
    return this._request("POST", endpoint, { body });
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

// Instance dùng chung toàn app (singleton) - đủ dùng cho một SPA nhỏ.
// Các repository có thể inject instance khác (ví dụ mock trong test) qua constructor.
export const apiService = new ApiService();
