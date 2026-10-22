import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthService } from "../../../../src/modules/auth/AuthService.js";
import {
  clearCsrfToken,
  getCsrfToken,
  setCsrfToken,
} from "../../../../src/shared/utils/csrf.js";

describe("AuthService", () => {
  let api;
  let service;

  beforeEach(() => {
    clearCsrfToken();
    sessionStorage.clear();

    api = {
      get: vi.fn(),
      post: vi.fn(),
    };

    service = new AuthService(api);
  });

  it("stores CSRF token after successful login", async () => {
    api.post.mockResolvedValue({
      user: {
        id: "user-1",
        email: "test@example.com",
      },
      csrfToken: "login-csrf-token",
    });

    const result = await service.login("test@example.com", "password");

    expect(api.post).toHaveBeenCalledWith("/auth/login", {
      email: "test@example.com",
      password: "password",
    });
    expect(getCsrfToken()).toBe("login-csrf-token");
    expect(result.user.id).toBe("user-1");
  });

  it("persists the authenticated user and CSRF token after email verification", async () => {
    const user = { id: "verified-user", email: "test@example.com" };
    api.get.mockResolvedValue({ user, csrfToken: "verification-csrf-token" });

    const result = await service.verifyEmail("example-verification-token");

    expect(api.get).toHaveBeenCalledWith("/auth/verify-email", {
      token: "example-verification-token",
    });
    expect(result.user).toEqual(user);
    expect(service.isAuthenticated).toBe(true);
    expect(getCsrfToken()).toBe("verification-csrf-token");
    expect(new AuthService(api).getCurrentUser()).toEqual(user);
  });

  it("does not authenticate when email verification fails", async () => {
    api.get.mockRejectedValue(new Error("Expired verification link"));

    await expect(service.verifyEmail("expired-example-token")).rejects.toThrow(
      "Expired verification link",
    );

    expect(service.isAuthenticated).toBe(false);
    expect(getCsrfToken()).toBeNull();
    expect(sessionStorage.getItem("triad_current_user")).toBeNull();
  });

  it("requests a new verification email without authenticating", async () => {
    const response = {
      message: "If that account exists, an email will be sent.",
    };
    api.post.mockResolvedValue(response);

    await expect(
      service.resendVerification("test@example.com"),
    ).resolves.toEqual(response);

    expect(api.post).toHaveBeenCalledWith("/auth/resend-verification", {
      email: "test@example.com",
    });
    expect(service.isAuthenticated).toBe(false);
    expect(getCsrfToken()).toBeNull();
  });

  it("replaces CSRF token after refresh", async () => {
    setCsrfToken("old-csrf-token");

    api.post.mockResolvedValue({
      user: {
        id: "user-1",
        email: "test@example.com",
      },
      csrfToken: "rotated-csrf-token",
    });

    await service.refresh();

    expect(api.post).toHaveBeenCalledWith("/auth/refresh", {});
    expect(getCsrfToken()).toBe("rotated-csrf-token");
  });

  it("clears CSRF token after logout", async () => {
    setCsrfToken("existing-csrf-token");
    api.post.mockResolvedValue({});

    await service.logout();

    expect(api.post).toHaveBeenCalledWith("/auth/logout", {});
    expect(getCsrfToken()).toBeNull();
  });

  it("restores CSRF token for persisted authenticated user", async () => {
    sessionStorage.setItem(
      "triad_current_user",
      JSON.stringify({
        id: "user-1",
        email: "test@example.com",
      }),
    );

    service = new AuthService(api);

    api.get.mockResolvedValue({
      csrfToken: "restored-csrf-token",
    });

    await service.restoreCsrfToken();

    expect(api.get).toHaveBeenCalledWith("/auth/csrf");
    expect(getCsrfToken()).toBe("restored-csrf-token");
  });

  it("does not request CSRF token without a persisted user", async () => {
    await service.restoreCsrfToken();

    expect(api.get).not.toHaveBeenCalled();
    expect(getCsrfToken()).toBeNull();
  });

  it("clears CSRF token when restoration fails", async () => {
    sessionStorage.setItem(
      "triad_current_user",
      JSON.stringify({
        id: "user-1",
        email: "test@example.com",
      }),
    );

    service = new AuthService(api);
    setCsrfToken("stale-csrf-token");

    api.get.mockRejectedValue(new Error("Unauthorized"));

    await service.restoreCsrfToken();

    expect(getCsrfToken()).toBeNull();
  });
});
