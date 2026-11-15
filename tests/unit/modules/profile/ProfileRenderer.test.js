import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileRenderer } from "../../../../src/modules/profile/ProfileRenderer.js";

describe("ProfileRenderer", () => {
  let container;
  let renderer;

  beforeEach(() => {
    document.body.innerHTML = '<div id="profile-view" aria-busy="false"></div>';
    container = document.getElementById("profile-view");
    renderer = new ProfileRenderer(container);
  });

  it("renders an accessible loading state", () => {
    renderer.renderLoading();

    expect(container.getAttribute("aria-busy")).toBe("true");
    expect(container.textContent).toContain("Đang tải hồ sơ");
  });

  it("renders an error and invokes the retry action", () => {
    const retry = vi.fn();
    renderer.renderError("Network unavailable", retry);
    container.querySelector("button").click();

    expect(container.textContent).toContain("Network unavailable");
    expect(retry).toHaveBeenCalledOnce();
    expect(container.getAttribute("aria-busy")).toBe("false");
  });

  it("renders an error without a retry button when no callback is provided", () => {
    renderer.renderError("Unavailable");

    expect(container.querySelector("button")).toBeNull();
    expect(container.textContent).toContain("Không thể tải hồ sơ");
  });

  it("renders login-required state and invokes the login action", () => {
    const login = vi.fn();
    renderer.renderLoginRequired(login);
    container.querySelector("button").click();

    expect(container.textContent).toContain("Đăng nhập để xem hồ sơ");
    expect(login).toHaveBeenCalledOnce();
    expect(container.getAttribute("aria-busy")).toBe("false");
  });

  it("renders customer profile fields, account metadata and navigation", () => {
    renderer.renderProfile({
      firstName: "An",
      lastName: "Nguyen",
      email: "an@example.com",
      phone: "0900000000",
      role: "ADMIN",
      isVerified: true,
      is2FAEnabled: true,
      createdAt: "2025-01-15T00:00:00.000Z",
    }, vi.fn());

    expect(container.textContent).toContain("An Nguyen");
    expect(container.textContent).toContain("an@example.com");
    expect(container.textContent).toContain("Quản trị viên");
    expect(container.textContent).toContain("Đã xác minh");
    expect(container.textContent).toContain("Đang bật");
    expect(container.querySelector('a[href="order-history.html"]')).toBeTruthy();
    expect(container.querySelector('a[href="products.html"]')).toBeTruthy();
    expect(container.getAttribute("aria-busy")).toBe("false");
  });

  it("uses safe fallbacks for missing profile values and invalid dates", () => {
    renderer.renderProfile({}, vi.fn());

    expect(container.textContent).toContain("Khách hàng TriAD");
    expect(container.textContent).toContain("Chưa có email");
    expect(container.textContent).toContain("Chưa xác minh");
    expect(container.textContent).toContain("Chưa bật");
    expect(container.textContent).toContain("Chưa có thông tin");
    expect(container.textContent).toContain("Thành viên");
  });

  it("submits edited fields and rerenders the updated profile", async () => {
    const updated = { firstName: "Binh", lastName: "Tran", email: "binh@example.com" };
    const onSave = vi.fn().mockResolvedValue(updated);
    renderer.renderProfile({ firstName: "An", lastName: "Nguyen" }, onSave);

    const form = container.querySelector("form");
    form.querySelector('[name="firstName"]').value = "Binh";
    form.querySelector('[name="lastName"]').value = "Tran";
    form.querySelector('[name="phone"]').value = "0911111111";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(onSave).toHaveBeenCalledOnce());

    expect(onSave).toHaveBeenCalledWith({
      firstName: "Binh",
      lastName: "Tran",
      phone: "0911111111",
    });
    expect(container.textContent).toContain("Binh Tran");
  });

  it("shows save errors and re-enables the submit button", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("Save failed"));
    renderer.renderProfile({ firstName: "An", lastName: "Nguyen" }, onSave);
    const form = container.querySelector("form");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    await vi.waitFor(() => expect(form.querySelector("button[type='submit']").disabled).toBe(false));
    expect(container.textContent).toContain("Save failed");
  });

  it("shows a fallback save error when the failure has no message", async () => {
    const onSave = vi.fn().mockRejectedValue({});
    renderer.renderProfile({}, onSave);
    const form = container.querySelector("form");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    await vi.waitFor(() => expect(container.textContent).toContain("Không thể lưu thông tin"));
  });

  it("handles a missing container without throwing", () => {
    const emptyRenderer = new ProfileRenderer(null);

    expect(() => emptyRenderer.renderLoading()).not.toThrow();
    expect(() => emptyRenderer.renderError("Error")).not.toThrow();
    expect(() => emptyRenderer.renderLoginRequired(vi.fn())).not.toThrow();
    expect(() => emptyRenderer.renderProfile({}, vi.fn())).not.toThrow();
  });
});
