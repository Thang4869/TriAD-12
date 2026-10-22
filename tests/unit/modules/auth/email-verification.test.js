import { beforeEach, describe, expect, it, vi } from "vitest";
import page from "../../../../verify-email.html?raw";
import { initializeEmailVerification } from "../../../../src/modules/auth/email-verification.js";
import { ApiError } from "../../../../src/shared/services/api.service.js";

describe("email verification page", () => {
  let service;
  let status;
  let form;
  let submit;

  beforeEach(() => {
    document.body.innerHTML = new DOMParser().parseFromString(
      page,
      "text/html",
    ).body.innerHTML;
    window.history.replaceState(null, "", "/verify-email");
    service = {
      verifyEmail: vi.fn().mockResolvedValue({ user: { id: "verified-user" } }),
      resendVerification: vi.fn().mockResolvedValue({}),
    };
    status = document.getElementById("verification-status");
    form = document.getElementById("resend-verification-form");
    submit = document.getElementById("resend-verification-submit");
  });

  it("offers recovery without automatically requesting mail when no token exists", async () => {
    await initializeEmailVerification(service);

    expect(service.verifyEmail).not.toHaveBeenCalled();
    expect(service.resendVerification).not.toHaveBeenCalled();
    expect(form.hidden).toBe(false);
    expect(submit.disabled).toBe(false);
    expect(status.textContent).toContain("yêu cầu gửi lại");
  });

  it("removes the token from the URL before verification and confirms success", async () => {
    window.history.replaceState(
      null,
      "",
      "/verify-email?token=example-verification-token#fragment",
    );
    service.verifyEmail.mockImplementation(async () => {
      expect(window.location.search).toBe("");
      expect(window.location.hash).toBe("");
    });

    await initializeEmailVerification(service);

    expect(service.verifyEmail).toHaveBeenCalledExactlyOnceWith(
      "example-verification-token",
    );
    expect(status.dataset.state).toBe("success");
    expect(form.hidden).toBe(true);
    expect(
      document.querySelector('a[href="/pages/products.html"]'),
    ).not.toBeNull();
    expect(page).toContain('name="referrer" content="no-referrer"');
  });

  it.each(["?token=", "?token=%20", "?token=first&token=second"])(
    "rejects an unusable token without calling the API: %s",
    async (query) => {
      window.history.replaceState(null, "", `/verify-email${query}`);

      await initializeEmailVerification(service);

      expect(service.verifyEmail).not.toHaveBeenCalled();
      expect(window.location.search).toBe("");
      expect(status.dataset.state).toBe("error");
      expect(form.hidden).toBe(false);
    },
  );

  it("allows requesting a new email after an expired link", async () => {
    window.history.replaceState(
      null,
      "",
      "/verify-email?token=expired-example",
    );
    service.verifyEmail.mockRejectedValue(
      new ApiError("Verification link is invalid or has expired", 400),
    );

    await initializeEmailVerification(service);

    expect(status.textContent).toBe(
      "Verification link is invalid or has expired",
    );
    expect(status.dataset.state).toBe("error");
    expect(form.hidden).toBe(false);
    expect(submit.disabled).toBe(false);
  });

  it("renders backend messages as text instead of HTML", async () => {
    window.history.replaceState(
      null,
      "",
      "/verify-email?token=invalid-example",
    );
    const message = '<img src="x" onerror="alert(1)">';
    service.verifyEmail.mockRejectedValue(new ApiError(message, 400));

    await initializeEmailVerification(service);

    expect(status.textContent).toBe(message);
    expect(status.querySelector("img")).toBeNull();
  });

  it("submits the email and displays an account-neutral response", async () => {
    await initializeEmailVerification(service);
    document.getElementById("verification-email").value = "test@example.com";

    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    await vi.waitFor(() => expect(status.dataset.state).toBe("success"));
    expect(service.resendVerification).toHaveBeenCalledExactlyOnceWith(
      "test@example.com",
    );
    expect(status.textContent).toContain(
      "Nếu tài khoản tồn tại và chưa xác minh",
    );
    expect(submit.disabled).toBe(false);
  });

  it("prevents duplicate mail requests while a submission is pending", async () => {
    let complete;
    service.resendVerification.mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    await initializeEmailVerification(service);
    document.getElementById("verification-email").value = "test@example.com";

    form.dispatchEvent(new Event("submit", { cancelable: true }));
    form.dispatchEvent(new Event("submit", { cancelable: true }));

    expect(service.resendVerification).toHaveBeenCalledTimes(1);
    expect(submit.disabled).toBe(true);
    complete({});
    await vi.waitFor(() => expect(submit.disabled).toBe(false));
  });

  it("shows a retryable error and re-enables submission after a mail request fails", async () => {
    service.resendVerification.mockRejectedValue(new Error("Network failure"));
    await initializeEmailVerification(service);
    document.getElementById("verification-email").value = "test@example.com";

    form.dispatchEvent(new Event("submit", { cancelable: true }));

    await vi.waitFor(() => expect(status.dataset.state).toBe("error"));
    expect(status.textContent).toBe(
      "Không thể hoàn tất yêu cầu. Vui lòng thử lại.",
    );
    expect(submit.disabled).toBe(false);
  });
});
