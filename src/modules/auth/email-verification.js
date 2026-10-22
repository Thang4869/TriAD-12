import { authService } from "./AuthService.js";
import { ApiError } from "../../shared/services/api.service.js";

export async function initializeEmailVerification(service = authService) {
  const url = new URL(window.location.href);
  const tokens = url.searchParams.getAll("token");
  // Do not retain the one-time credential in navigation history or outgoing links.
  window.history.replaceState(null, "", url.pathname);

  const status = document.getElementById("verification-status");
  const form = document.getElementById("resend-verification-form");
  const email = document.getElementById("verification-email");
  const submit = document.getElementById("resend-verification-submit");

  const showError = (error) => {
    status.textContent =
      error instanceof ApiError
        ? error.message
        : "Không thể hoàn tất yêu cầu. Vui lòng thử lại.";
    status.dataset.state = "error";
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submit.disabled || !form.reportValidity()) return;

    submit.disabled = true;
    status.textContent = "Đang gửi yêu cầu…";
    status.dataset.state = "pending";
    try {
      await service.resendVerification(email.value.trim());
      status.textContent =
        "Nếu tài khoản tồn tại và chưa xác minh, email mới sẽ được gửi. Vui lòng kiểm tra cả thư rác.";
      status.dataset.state = "success";
    } catch (error) {
      showError(error);
    } finally {
      submit.disabled = false;
    }
  });

  if (tokens.length === 0) {
    status.textContent =
      "Mở liên kết xác minh trong email, hoặc yêu cầu gửi lại bên dưới.";
    return;
  }
  if (tokens.length !== 1 || !tokens[0].trim()) {
    status.textContent =
      "Liên kết xác minh không hợp lệ. Vui lòng yêu cầu email mới.";
    status.dataset.state = "error";
    return;
  }

  submit.disabled = true;
  status.textContent = "Đang xác minh email…";
  status.dataset.state = "pending";
  try {
    await service.verifyEmail(tokens[0]);
    status.textContent = "Email đã được xác minh. Bạn có thể tiếp tục mua sắm.";
    status.dataset.state = "success";
    form.hidden = true;
  } catch (error) {
    showError(error);
  } finally {
    submit.disabled = false;
  }
}
