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

  it("should reject email with whitespace only", () => {
    const data = {
      firstName: "John",
      lastName: "Doe",
      email: "   ",
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

  describe("card validation", () => {
    const baseData = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "0123456789",
      address: "123 Main St",
      paymentMethod: "card",
    };

    it("should require card number", () => {
      const data = { ...baseData, cardNumber: "" };
      const result = validator.validate(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Card number is required");
    });

    it("should require card expiry", () => {
      const data = { ...baseData, cardNumber: "1234567890123456", cardExpiry: "" };
      const result = validator.validate(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Card expiry is required");
    });

    it("should require CVV", () => {
      const data = { ...baseData, cardNumber: "1234567890123456", cardExpiry: "12/25", cardCvv: "" };
      const result = validator.validate(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("CVV is required");
    });

    it("should reject invalid card number (length < 16)", () => {
      const data = { ...baseData, cardNumber: "1234", cardExpiry: "12/25", cardCvv: "123" };
      const result = validator.validate(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid card number (must be 16 digits)");
    });

    it("should accept valid card details", () => {
      const data = {
        ...baseData,
        cardNumber: "1234567890123456",
        cardExpiry: "12/25",
        cardCvv: "123",
      };
      const result = validator.validate(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should accept card number with spaces", () => {
      const data = {
        ...baseData,
        cardNumber: "1234 5678 9012 3456",
        cardExpiry: "12/25",
        cardCvv: "123",
      };
      const result = validator.validate(data);
      expect(result.isValid).toBe(true);
    });
  });
});