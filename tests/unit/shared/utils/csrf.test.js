import { beforeEach, describe, expect, it } from "vitest";
import {
  clearCsrfToken,
  getCsrfToken,
  setCsrfToken,
} from "../../../../src/shared/utils/csrf.js";

describe("CSRF token store", () => {
  beforeEach(() => {
    clearCsrfToken();
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
});
