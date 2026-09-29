import { describe, it, expect } from "vitest";
import { CheckoutValidator } from "../../../../src/modules/checkout/CheckoutValidator.js";

describe("CheckoutValidator", () => {
  const validator = new CheckoutValidator();

  it("should validate valid data", () => {
    const validData = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "0123456789",
      address: "123 Main St",
      paymentMethod: "cod",
    };
    const result = validator.validate(validData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return errors for missing required fields", () => {
    const data = { firstName: "", lastName: "" };
    const result = validator.validate(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Phone is required");
    expect(result.errors).toContain("Address is required");
  });

  it("should validate phone number (10-12 digits)", () => {
    const data = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "123",
      address: "123 Main St",
    };
    const result = validator.validate(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid phone number (10-12 digits)");
  });

  it("should reject phone with whitespace only", () => {
    const data = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "   ",
      address: "123 Main St",
    };
    const result = validator.validate(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid phone number (10-12 digits)");
  });
});
