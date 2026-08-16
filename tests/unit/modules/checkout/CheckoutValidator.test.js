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
    expect(result.errors).toContain("First name is required");
    expect(result.errors).toContain("Last name is required");
    expect(result.errors).toContain("Email is required");
    expect(result.errors).toContain("Phone is required");
    expect(result.errors).toContain("Address is required");
  });

  it("should validate email format", () => {
    const data = {
      firstName: "John",
      lastName: "Doe",
      email: "invalid-email",
      phone: "0123456789",
      address: "123 Main St",
    };
    const result = validator.validate(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid email format");
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

  it("should validate card details when payment method is card", () => {
    const data = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "0123456789",
      address: "123 Main St",
      paymentMethod: "card",
      cardNumber: "1234",
      cardExpiry: "12/25",
      cardCvv: "123",
    };
    const result = validator.validate(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid card number (must be 16 digits)");
  });
});
