import { beforeEach, describe, expect, it } from "vitest";
import { getCsrfToken } from "../../../../src/shared/utils/csrf.js";

describe("getCsrfToken", () => {
  beforeEach(() => {
    document.cookie = "csrfToken=; Max-Age=0; path=/";
  });

  it("should return CSRF token from cookie", () => {
    document.cookie = "csrfToken=test-token; path=/";

    expect(getCsrfToken()).toBe("test-token");
  });

  it("should decode encoded CSRF token", () => {
    document.cookie = `csrfToken=${encodeURIComponent("token=value&test")}; path=/`;

    expect(getCsrfToken()).toBe("token=value&test");
  });

  it("should find CSRF token among multiple cookies", () => {
    document.cookie = "session=test-session; path=/";
    document.cookie = "csrfToken=csrf-123; path=/";
    document.cookie = "theme=dark; path=/";

    expect(getCsrfToken()).toBe("csrf-123");
  });

  it("should return null when CSRF cookie is missing", () => {
    document.cookie = "otherCookie=value; path=/";

    expect(getCsrfToken()).toBeNull();
  });

  it("should return empty string when CSRF cookie exists but is empty", () => {
    document.cookie = "csrfToken=; path=/";

    expect(getCsrfToken()).toBe("");
  });
});
