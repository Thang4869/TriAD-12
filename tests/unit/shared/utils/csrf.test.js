import { beforeEach, describe, expect, it } from "vitest";
import {
  clearCsrfToken,
  getCsrfToken,
  setCsrfToken,
  readSameOriginCsrfCookie,
} from "../../../../src/shared/utils/csrf.js";

describe("CSRF token store", () => {
  beforeEach(() => {
    clearCsrfToken();
    document.cookie = "csrfToken=; Max-Age=0; Path=/";
    document.cookie = "otherCsrfToken=; Max-Age=0; Path=/";
  });

  it("should return null when token is not set", () => {
    expect(getCsrfToken()).toBeNull();
  });

  it("should store and return CSRF token", () => {
    setCsrfToken("test-token");

    expect(getCsrfToken()).toBe("test-token");
  });

  it("should replace existing CSRF token", () => {
    setCsrfToken("old-token");
    setCsrfToken("new-token");

    expect(getCsrfToken()).toBe("new-token");
  });

  it("should clear CSRF token", () => {
    setCsrfToken("test-token");
    clearCsrfToken();

    expect(getCsrfToken()).toBeNull();
  });

  it("should reject empty or non-string token values", () => {
    setCsrfToken("");
    expect(getCsrfToken()).toBeNull();

    setCsrfToken(null);
    expect(getCsrfToken()).toBeNull();

    setCsrfToken(123);
    expect(getCsrfToken()).toBeNull();
  });

  it("reads only the exact CSRF cookie for a same-origin API without persisting it", () => {
    document.cookie = `otherCsrfToken=${"b".repeat(64)}; Path=/`;
    document.cookie = `csrfToken=${"a".repeat(64)}; Path=/`;

    expect(readSameOriginCsrfCookie("/api")).toBe("a".repeat(64));
    expect(readSameOriginCsrfCookie(`${window.location.origin}/api`)).toBe(
      "a".repeat(64),
    );
    expect(getCsrfToken()).toBeNull();
  });

  it.each([
    "https://another-origin.invalid/api",
    "//another-origin.invalid/api",
    "",
    null,
    "http://[",
  ])("does not reuse cookies for an unsupported API URL: %s", (url) => {
    document.cookie = `csrfToken=${"a".repeat(64)}; Path=/`;
    expect(readSameOriginCsrfCookie(url)).toBeNull();
  });

  it.each(["short", "g".repeat(64), "%E0%A4%A"])(
    "ignores a malformed CSRF cookie: %s",
    (token) => {
      document.cookie = `csrfToken=${token}; Path=/`;
      expect(readSameOriginCsrfCookie("/api")).toBeNull();
    },
  );

  it("returns null when the CSRF cookie is absent", () => {
    document.cookie = `otherCsrfToken=${"b".repeat(64)}; Path=/`;
    expect(readSameOriginCsrfCookie("/api")).toBeNull();
  });
});
