const CSRF_COOKIE_NAME = "csrfToken";

/**
 * Backend set cookie "csrfToken" với httpOnly: false (đọc được từ JS) khi
 * đăng nhập thành công. Khi gọi các endpoint có csrfProtection (auth/refresh,
 * auth/logout), phải gửi kèm giá trị này qua header "x-csrf-token".
 * Xem src/shared/middlewares/csrf.middleware.ts phía backend.
 */
export function getCsrfToken() {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}