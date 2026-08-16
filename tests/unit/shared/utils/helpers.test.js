import { describe, it, expect } from "vitest";
import {
  formatPrice,
  formatNumber,
  generateOrderId,
  formatDate,
} from "../../../../src/shared/utils/helpers.js";

describe("helpers", () => {
  it("should format price", () => {
    expect(formatPrice(150000)).toBe("150.000 ₫");
    expect(formatPrice(0)).toBe("0 ₫");
  });

  it("should format number", () => {
    expect(formatNumber(1234567)).toBe("1.234.567");
  });

  it("should generate order ID", () => {
    const id = generateOrderId();
    expect(id).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]+$/);
  });

  it("should format date", () => {
    const date = new Date(2026, 7, 11, 14, 30);
    const formatted = formatDate(date);
    expect(formatted).toContain("11");
    expect(formatted).toContain("tháng 8");
    expect(formatted).toContain("2026");
  });
});
